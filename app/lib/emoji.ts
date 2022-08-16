export const isEmoji = (value: string): boolean => {
  const pattern =
    /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]/gu;
  return value.match(pattern)?.length === 1;
};
