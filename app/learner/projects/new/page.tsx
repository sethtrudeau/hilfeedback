import { requireUser } from "@/lib/auth";
import { CreateProjectForm } from "./CreateProjectForm";

export default async function NewProjectPage() {
  await requireUser("learner");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="h1">New project</h1>
      <CreateProjectForm />
    </div>
  );
}
