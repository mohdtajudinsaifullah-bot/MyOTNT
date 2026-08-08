import { redirect } from "next/navigation";

export default function Home() {
  // Bila pengguna layari URL utama (https://my-otnt-six.vercel.app/),
  // sistem terus hantar dia ke /dashboard automatik!
  redirect("/dashboard");
}