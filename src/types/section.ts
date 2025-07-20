export type CardProps<IconType = any> = {
  title: string;
  subtitle: string;
  description: string;
  icon: IconType;
  link?: string;
};
