import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons";

const BooleanIcon = ({ value }: { value?: boolean | null }) => {
  if (value) return <CheckIcon />;
  return <Cross2Icon />;
};

export default BooleanIcon;
