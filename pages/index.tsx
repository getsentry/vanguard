import type { InferGetServerSidePropsType } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import prisma from "../lib/prisma";
import { Post } from "@prisma/client";

export async function getServerSideProps() {
  const postList: Post[] = await prisma.post.findMany({
    where: { published: true },
    include: {
      author: {
        select: { name: true },
      },
    },
  });
  return {
    props: {
      postList: postList.map((post) => ({
        ...post,
        createdAt: post.createdAt.toString(),
        updatedAt: post.updatedAt.toString(),
      })),
    },
  };
}

export default function HomePage({
  postList,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Vanguard</title>
      </Head>

      <main className={styles.main}>
        <h1>Posts</h1>
        {postList.map((post) => (
          <div key={post.id}>
            <h2>{post.title}</h2>
          </div>
        ))}
      </main>
    </div>
  );
}
