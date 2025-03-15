import { Link as RouterLink } from "react-router";
import MaterialLink from "@mui/material/Link";

interface LinkProps {
  to: string;
  className?: string;
  children: React.ReactNode;
}

export default function Link(props: LinkProps) {
  return <MaterialLink component={RouterLink} {...props} />;
}
