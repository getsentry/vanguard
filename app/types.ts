import type { User } from "@prisma/client";
import type {
  ComponentPropsWithoutRef,
  ElementType,
  PropsWithChildren,
} from "react";

export type PolymorphicAsProp<E extends ElementType> = {
  as?: E;
};

export type PolymorphicProps<E extends ElementType> = PropsWithChildren<
  ComponentPropsWithoutRef<E> & PolymorphicAsProp<E>
>;

export type SessionPayload = {
  user: User;
};
