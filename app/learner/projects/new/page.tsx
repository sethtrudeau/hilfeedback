import { requireUser } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import { CreateProjectForm } from "./CreateProjectForm";

export default async function NewProjectPage() {
  await requireUser("learner");
  return (
    <div className="mx-auto flex max-w-(--w-form) flex-col gap-6">
      <PageHead crumbs={[{ label: "My projects", href: "/learner" }, { label: "New project" }]} title="New project" />
      <CreateProjectForm />
    </div>
  );
}
