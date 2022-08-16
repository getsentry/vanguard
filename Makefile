PG_CONTAINER=docker exec -t vanguard_postgres_1

develop: install-requirements setup-git create-db migrate-db

upgrade: install-requirements migrate-db

setup-git:
	pre-commit install
	git config branch.autosetuprebase always

install-requirements:
	npm install
	npm run setup

test:
	npm run test

reset-db:
	$(MAKE) drop-db
	$(MAKE) create-db
	$(MAKE) migrate-db

drop-db:
	$(PG_CONTAINER) dropdb --if-exists -h 127.0.0.1 -p 5432 -U postgres vanguard
	$(PG_CONTAINER) dropdb --if-exists -h 127.0.0.1 -p 5432 -U postgres test_vanguard

create-db:
	$(PG_CONTAINER) createdb -E utf-8 -h 127.0.0.1 -p 5432 -U postgres vanguard
	$(PG_CONTAINER) createdb -E utf-8 -h 127.0.0.1 -p 5432 -U postgres test_vanguard

migrate-db:
	npm run db:migrate

build-docker-image:
	docker build -t vanguard .

run-docker-image:
	docker rm vanguard || exit 0
	docker run --rm --init --network host -p 3000:3000/tcp --env-file ./.env --name vanguard vanguard
