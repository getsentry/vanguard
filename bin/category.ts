import { installGlobals } from "@remix-run/node";
import { program } from "commander";
import { createCategory } from "~/models/category.server";

installGlobals();

program
  .name("category")
  .description("CLI for assisting with category management");

program
  .command("create")
  .description("Create a category")
  .argument("<slug>")
  .argument("<name>")
  .action(async (slug, name) => {
    const category = await createCategory({
      slug,
      name,
    });

    console.log(`${category.name} created.`);
  });

program.parseAsync();
