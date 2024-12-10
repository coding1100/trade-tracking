module.exports = {
  async redirects() {
    return [
      {
        source: "/",
        has: [
          {
            type: "cookie",
            key: "token",
          },
        ],
        destination: "/home",
        permanent: false,
      },
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },
};
