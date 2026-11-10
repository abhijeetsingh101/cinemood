import Link from "next/link";
import { Notice } from "@/components/ui/States";

export default function NotFound() {
  return (
    <Notice title="This sector is empty" action={<Link href="/" className="neon-btn">Return home</Link>}>
      The page or film you were looking for does not exist.
    </Notice>
  );
}
