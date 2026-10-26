import { AdminBlogEditor } from "@/modules/admin/components/AdminBlogEditor";

export const metadata = {
  title: "Edit Article | Admin | Store4Riders",
};

export default async function AdminEditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <AdminBlogEditor id={resolvedParams.id} />;
}
