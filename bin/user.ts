import { installGlobals } from "@remix-run/node";
import { program } from "commander";
import { exit } from "process";
import {
  changePassword,
  createUser,
  getUserByEmail,
  updateUser,
} from "~/models/user.server";

installGlobals();

program.name("user").description("CLI for assisting with user management");

program
  .command("create")
  .description("Create a user")
  .argument("<email>")
  .argument("<password>")
  .option("-a, --admin")
  .option("--name <name>")
  .action(async (email, password, options) => {
    const user = await createUser({
      name: options.name || email.split("@")[0],
      email,
      password,
      admin: options.admin || false,
    });

    console.log(`${user.email} created.`);
  });

program
  .command("set-password")
  .description("Set a users password")
  .argument("<email>")
  .argument("<password>")
  .action(async (email, password) => {
    const user = await getUserByEmail(email);

    if (!user) {
      console.error(`Cannot find user: ${email}`);
      exit(1);
    }

    await changePassword({ user, newPassword: password });

    console.log(`${user.email} password changed`);
  });

program
  .command("make-admin")
  .description("Make a user admin")
  .argument("<email>")
  .action(async (email) => {
    const user = await getUserByEmail(email);

    if (!user) {
      console.error(`Cannot find user: ${email}`);
      exit(1);
    }

    updateUser({ id: user.id, userId: user.id, admin: true });
    console.log(`${user.email} updated to be admin.`);
  });

program.parseAsync();
