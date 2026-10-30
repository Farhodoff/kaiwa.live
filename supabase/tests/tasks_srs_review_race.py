#!/usr/bin/env python3
"""Race the exact SRS migration in a disposable, TCP-disabled PostgreSQL cluster.

Run from any directory (Python standard library only):
  python3 supabase/tests/tasks_srs_review_race.py \
    --pg-bin /opt/homebrew/Cellar/postgresql@14/14.23/bin

Requires permission to start local PostgreSQL (shared memory and Unix sockets).
Never accepts a database URL or connects to an existing cluster.
"""

import argparse
import os
from pathlib import Path
import queue
import subprocess
import tempfile
import threading
import time


USER = "00000000-0000-0000-0000-000000000001"
KEY_FILTER = (
    f"user_id = '{USER}' AND srs_lesson_id = 'race-lesson' "
    "AND srs_review_date = DATE '2026-10-29' AND deleted_at IS NULL"
)
RETRY = (
    "INSERT INTO public.tasks (user_id, title, srs_lesson_id, srs_review_date) "
    f"VALUES ('{USER}', 'Must not replace completed row', 'race-lesson', '2026-10-29');"
)


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pg-bin', type=Path, required=True)
    args = parser.parse_args()
    tests = Path(__file__).resolve().parent
    migration = tests.parent / 'migrations/20261029064607_tasks_srs_review_idempotency.sql'
    # Ignore inherited libpq connection settings, including service/password files.
    env = {key: value for key, value in os.environ.items() if not key.startswith('PG')}
    children = []

    with tempfile.TemporaryDirectory(prefix='srs-race-', dir='/tmp') as temporary:
        root = Path(temporary)
        data = root / 'data'
        sockets = root / 'sock'
        sockets.mkdir()
        started = False

        def run(binary, *arguments):
            return subprocess.run(
                [str(args.pg_bin / binary), *map(str, arguments)],
                env=env, check=True, text=True, capture_output=True, timeout=30,
            )

        try:
            run('initdb', '-D', data, '-A', 'trust', '-U', 'postgres',
                '--no-locale', '--encoding=UTF8')
            run('pg_ctl', '-D', data, '-l', root / 'server.log', '-o',
                f"-F -k {sockets} -h '' -p 55439", '-w', 'start')
            started = True
            run('createdb', '-h', sockets, '-p', '55439', '-U', 'postgres',
                'srs_idempotency_race')
            psql = [
                str(args.pg_bin / 'psql'), '-X', '-qAt', '-h', str(sockets),
                '-p', '55439', '-U', 'postgres', '-d', 'srs_idempotency_race',
                '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose',
            ]
            subprocess.run(
                psql + ['--single-transaction', '-f', str(tests / 'tasks_srs_review_setup.sql'),
                        '-f', str(migration)],
                env=env, check=True, capture_output=True, text=True, timeout=30,
            )
            first = subprocess.Popen(
                psql, env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                stderr=subprocess.PIPE, text=True, bufsize=1,
            )
            children.append(first)
            lines = queue.Queue()

            def read_first():
                for line in first.stdout:
                    lines.put(line.rstrip('\n'))

            threading.Thread(target=read_first, daemon=True).start()

            def first_query(sql):
                first.stdin.write(sql + '\n')
                first.stdin.flush()
                try:
                    return lines.get(timeout=10)
                except queue.Empty:
                    raise RuntimeError('First PostgreSQL session did not respond within 10 seconds')

            require(first_query(
                "BEGIN; SET LOCAL statement_timeout = '15s'; "
                "INSERT INTO public.tasks "
                "(user_id, title, srs_lesson_id, srs_review_date, completed, status, completed_at) "
                f"VALUES ('{USER}', 'Completed winner', 'race-lesson', '2026-10-29', "
                "true, 'done', '2026-10-29 12:00:00+00'); "
                "SELECT 'first_insert_uncommitted';"
            ) == 'first_insert_uncommitted', 'First insert failed')

            second = subprocess.Popen(
                psql + ['-c', "SET application_name = 'srs_race_second'; "
                        "SET statement_timeout = '15s'; " + RETRY],
                env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
            )
            children.append(second)
            deadline = time.monotonic() + 10
            while True:
                # Refresh activity stats while the observer transaction stays open.
                waiting = first_query(
                    "DO $$ BEGIN PERFORM pg_stat_clear_snapshot(); END $$; "
                    "SELECT count(*) FROM pg_stat_activity "
                    "WHERE application_name = 'srs_race_second' "
                    "AND state = 'active' AND wait_event_type = 'Lock' "
                    "AND wait_event = 'transactionid';"
                )
                if waiting == '1':
                    break
                require(second.poll() is None, 'Second insert exited before lock contention')
                require(time.monotonic() < deadline, 'Second insert never waited on the first transaction')
                time.sleep(0.05)
            print('PASS: two independent sessions overlapped; second INSERT waited on transactionid lock')

            require(first_query("COMMIT; SELECT 'first_committed';") == 'first_committed',
                    'First transaction did not commit')
            _, conflict = second.communicate(timeout=20)

            def check_conflict(code, error):
                require(code == 1 and '23505' in error and 'tasks_srs_review_unique' in error,
                        f'Expected psql -c exit 1 / 23505 / tasks_srs_review_unique, got {code}: {error}')

            check_conflict(second.returncode, conflict)
            print('PASS: session 1 committed; session 2 failed with 23505 / tasks_srs_review_unique')
            require(first_query(f'SELECT count(*) FROM public.tasks WHERE {KEY_FILTER};') == '1',
                    'Expected exactly one active row for the raced key')
            require(first_query(
                f"SELECT completed AND status = 'done' "
                "AND completed_at = TIMESTAMPTZ '2026-10-29 12:00:00+00' "
                f"AND title = 'Completed winner' FROM public.tasks WHERE {KEY_FILTER};"
            ) == 't', 'Winning row did not retain completed state')
            before = first_query(f'SELECT to_jsonb(t) FROM public.tasks t WHERE {KEY_FILTER};')
            retry = subprocess.run(
                psql + ['-c', RETRY], env=env, capture_output=True, text=True, timeout=20,
            )
            check_conflict(retry.returncode, retry.stderr)
            after = first_query(f'SELECT to_jsonb(t) FROM public.tasks t WHERE {KEY_FILTER};')
            require(before == after, 'Retry modified the winning completed row')
            require(first_query(f'SELECT count(*) FROM public.tasks WHERE {KEY_FILTER};') == '1',
                    'Retry changed active row count')
            print('PASS: retry failed with 23505 / tasks_srs_review_unique; row count = 1; '
                  'entire completed row unchanged (including ID, status, and completed_at)')
        finally:
            for child in children:
                if child.poll() is None:
                    child.kill()
                child.communicate(timeout=10)
            if started or (data / 'postmaster.pid').exists():
                run('pg_ctl', '-D', data, '-m', 'immediate', '-w', 'stop')
            print('Disposable PostgreSQL cluster stopped (if started); temporary files being removed')
    print('PASS: temporary cluster directory removed')


if __name__ == '__main__':
    main()
