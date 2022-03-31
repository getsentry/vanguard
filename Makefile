develop: install-requirements setup-git

upgrade: install-requirements migrate-db

setup-git:
	pre-commit install
	git config branch.autosetuprebase always

install-requirements:
	npm install

test:
	npm run test

reset-db:
	$(MAKE) drop-db
	$(MAKE) create-db
	$(MAKE) migrate-db

drop-db:
	dropdb --if-exists -h 127.0.0.1 -p 5432 -U postgres vanguard

create-db:
	createdb -E utf-8 -h 127.0.0.1 -p 5432 -U postgres vanguard

migrate-db:
	npx prisma migrate dev
