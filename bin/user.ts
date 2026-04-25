import { program } from "commander";
import { exit } from "process";
import { createUser, getUserByEmail, updateUser } from "~/models/user.server";

program.name("user").description("CLI for assisting with user management");

program
  .command("create")
  .description("Create a user (passwordless — sign-in is Google-only)")
  .argument("<email>")
  .option("-a, --admin")
  .option("--name <name>")
  .action(async (email, options) => {
    const user = await createUser({
      name: options.name || email.split("@")[0],
      email,
      admin: options.admin || false,
    });

    console.log(`${user.email} created.`);
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

    await updateUser({ id: user.id, actor: user, admin: true });
    console.log(`${user.email} updated to be admin.`);
  });

program.parseAsync();
