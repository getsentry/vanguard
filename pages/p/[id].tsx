import type {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import Head from "next/head";
import prisma from "../../lib/prisma";
import { Post } from "@prisma/client";

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const post = await prisma.post.findUnique({
    where: {
      id: Number(params?.id),
    },
    include: {
      author: {
        select: { name: true },
      },
    },
  });

  return {
    props: { post },
  };
};

const Post: NextPage = ({
  post,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <div>
      <Head>
        <title>Vanguard</title>
      </Head>

      <main>
        <h1>{post.title}</h1>
      </main>
    </div>
  );
};

export default Post;
