import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";
import { loader } from "./$feedId[.]xml";

describe("GET /feeds/$feedId.xml", () => {
  it("renders xml", async () => {
    const feed = await Fixtures.Feed();
    const response = await loader({
      request: await buildRequest(`http://localhost/feeds/${feed.id}.xml`, {
        method: "GET",
        headers: {
          host: "localhost",
        },
      }),
      params: { feedId: feed.id },
      context: {},
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/xml");
  });
});
