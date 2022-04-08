PG_CONTAINER=docker exec -t vanguard_postgres_1

develop: install-requirements setup-git

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
	$(PG_CONTAINER) dropdb --if-exists -h 127.0.0.1 -p 5432 -U postgres postgres

create-db:
	$(PG_CONTAINER) createdb -E utf-8 -h 127.0.0.1 -p 5432 -U postgres postgres

migrate-db:
	npx prisma migrate dev
	npx prisma db seed

build-docker-image:
	docker build -t vanguard .

run-docker-image:
	docker rm vanguard || exit 0
	docker run --rm --init --network host -p 3000:3000/tcp --env-file ./.env --name vanguard vanguard
