export default function About() {
  return (
    <div>
      <h1>About Vanguard</h1>
      <p>
        Vanguard has been designed to provide a way to create permanence around
        timely internal moments at Sentry. While the core of it is a simple
        blog, it's intending to continuously enable the culture of sharing what
        we're building at Sentry. Additionally we have recognized the need to
        create more long lasting moments out of things that are top of mind,
        which we're dubbing as 'Sentry' in this context. You'll see several
        historical posts by myself of this nature.
      </p>
      <p>
        As way of an introduction, Vanguard includes some key features you
        should be aware of:
      </p>
      <ul>
        <li>
          A simple posting flow, which includes the ability to drag and drop
          images, and render simple markdown
        </li>
        <li>
          The ability for us to categorize posts, and include additional
          information based on the category (such as a URL to a video demo for
          Shipped)
        </li>
        <li>
          Integration with notification services, such as Slack and Email, to
          broadcast new posts
        </li>
      </ul>
      <p>
        Most importantly, as with everything we build at Sentry, Vanguard is
        open to all for contributions on GitHub:
      </p>
      <p>
        <a href="https://github.com/getsentry/vanguard">
          https://github.com/getsentry/vanguard
        </a>
      </p>
      <p>
        Vanguard is built on top of Remix, which is a newer framework-esque
        approach to building hybrid applications (where they render on the
        server, but provide partial responsive UI updates).
      </p>
      <p>Enjoy!</p>
    </div>
  );
}
