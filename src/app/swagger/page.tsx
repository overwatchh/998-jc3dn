import { getApiDocs } from "@/lib/server/swagger";
import ReactSwagger from "./react_swagger";

export default async function IndexPage() {
  const spec = await getApiDocs();
  return (
    <section className="container">
      <ReactSwagger spec={spec} />
    </section>
  );
}