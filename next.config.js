/** @type {import('next').NextConfig} */

const domainUrl = new URL('https://is1-ssl.mzstatic.com');
const domainUrl2 = new URL('https://imagecache.lidarr.audio');
const domainUrl3 = new URL('http://assets.fanart.tv');

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{
      protocol: domainUrl.protocol.split(':')[0],
      hostname: domainUrl.hostname,
      port: domainUrl.port,
      pathname: '/**/*',
    }, {
      protocol: domainUrl2.protocol.split(':')[0],
      hostname: domainUrl2.hostname,
      port: domainUrl2.port,
      pathname: '/**/*',
    }, {
      protocol: domainUrl3.protocol.split(':')[0],
      hostname: domainUrl3.hostname,
      port: domainUrl3.port,
      pathname: '/**/*',
    }],
  },
}

module.exports = nextConfig
