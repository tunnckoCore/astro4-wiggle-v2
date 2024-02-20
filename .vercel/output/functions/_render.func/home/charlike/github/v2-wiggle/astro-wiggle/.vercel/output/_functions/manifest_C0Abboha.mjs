import 'cookie';
import { bold, red, yellow, dim, blue } from 'kleur/colors';
import 'html-escaper';
import 'clsx';
import './chunks/astro_bHY3mzoH.mjs';
import { compile } from 'path-to-regexp';

const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});
const levels = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  silent: 90
};
function log(opts, level, label, message, newLine = true) {
  const logLevel = opts.level;
  const dest = opts.dest;
  const event = {
    label,
    level,
    message,
    newLine
  };
  if (!isLogLevelEnabled(logLevel, level)) {
    return;
  }
  dest.write(event);
}
function isLogLevelEnabled(configuredLogLevel, level) {
  return levels[configuredLogLevel] <= levels[level];
}
function info(opts, label, message, newLine = true) {
  return log(opts, "info", label, message, newLine);
}
function warn(opts, label, message, newLine = true) {
  return log(opts, "warn", label, message, newLine);
}
function error(opts, label, message, newLine = true) {
  return log(opts, "error", label, message, newLine);
}
function debug(...args) {
  if ("_astroGlobalDebug" in globalThis) {
    globalThis._astroGlobalDebug(...args);
  }
}
function getEventPrefix({ level, label }) {
  const timestamp = `${dateTimeFormat.format(/* @__PURE__ */ new Date())}`;
  const prefix = [];
  if (level === "error" || level === "warn") {
    prefix.push(bold(timestamp));
    prefix.push(`[${level.toUpperCase()}]`);
  } else {
    prefix.push(timestamp);
  }
  if (label) {
    prefix.push(`[${label}]`);
  }
  if (level === "error") {
    return red(prefix.join(" "));
  }
  if (level === "warn") {
    return yellow(prefix.join(" "));
  }
  if (prefix.length === 1) {
    return dim(prefix[0]);
  }
  return dim(prefix[0]) + " " + blue(prefix.splice(1).join(" "));
}
if (typeof process !== "undefined") {
  let proc = process;
  if ("argv" in proc && Array.isArray(proc.argv)) {
    if (proc.argv.includes("--verbose")) ; else if (proc.argv.includes("--silent")) ; else ;
  }
}
class Logger {
  options;
  constructor(options) {
    this.options = options;
  }
  info(label, message, newLine = true) {
    info(this.options, label, message, newLine);
  }
  warn(label, message, newLine = true) {
    warn(this.options, label, message, newLine);
  }
  error(label, message, newLine = true) {
    error(this.options, label, message, newLine);
  }
  debug(label, ...messages) {
    debug(label, ...messages);
  }
  level() {
    return this.options.level;
  }
  forkIntegrationLogger(label) {
    return new AstroIntegrationLogger(this.options, label);
  }
}
class AstroIntegrationLogger {
  options;
  label;
  constructor(logging, label) {
    this.options = logging;
    this.label = label;
  }
  /**
   * Creates a new logger instance with a new label, but the same log options.
   */
  fork(label) {
    return new AstroIntegrationLogger(this.options, label);
  }
  info(message) {
    info(this.options, this.label, message);
  }
  warn(message) {
    warn(this.options, this.label, message);
  }
  error(message) {
    error(this.options, this.label, message);
  }
  debug(message) {
    debug(this.label, message);
  }
}

function getRouteGenerator(segments, addTrailingSlash) {
  const template = segments.map((segment) => {
    return "/" + segment.map((part) => {
      if (part.spread) {
        return `:${part.content.slice(3)}(.*)?`;
      } else if (part.dynamic) {
        return `:${part.content}`;
      } else {
        return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
    }).join("");
  }).join("");
  let trailing = "";
  if (addTrailingSlash === "always" && segments.length) {
    trailing = "/";
  }
  const toPath = compile(template + trailing);
  return toPath;
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware(_, next) {
      return next();
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    clientDirectives,
    routes
  };
}

const manifest = deserializeManifest({"adapterName":"@astrojs/vercel/serverless","routes":[{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/hoisted.Cx-ISqvT.js"},{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[{"type":"external","src":"/_astro/_input_.Fb_eNw7q.css"},{"type":"external","src":"/_astro/_input_.CHdLl6ZZ.css"}],"routeData":{"route":"/address/[input]","isIndex":false,"type":"page","pattern":"^\\/address\\/([^/]+?)\\/?$","segments":[[{"content":"address","dynamic":false,"spread":false}],[{"content":"input","dynamic":true,"spread":false}]],"params":["input"],"component":"src/pages/address/[input].astro","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[],"routeData":{"route":"/api/ethscriptions/[id]/content","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/ethscriptions\\/([^/]+?)\\/content\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"ethscriptions","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}],[{"content":"content","dynamic":false,"spread":false}]],"params":["id"],"component":"src/pages/api/ethscriptions/[id]/content/index.ts","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[],"routeData":{"route":"/api/ethscriptions/[id]/creator","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/ethscriptions\\/([^/]+?)\\/creator\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"ethscriptions","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}],[{"content":"creator","dynamic":false,"spread":false}]],"params":["id"],"component":"src/pages/api/ethscriptions/[id]/creator/index.ts","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[],"routeData":{"route":"/api/ethscriptions/[id]/number","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/ethscriptions\\/([^/]+?)\\/number\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"ethscriptions","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}],[{"content":"number","dynamic":false,"spread":false}]],"params":["id"],"component":"src/pages/api/ethscriptions/[id]/number/index.ts","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[],"routeData":{"route":"/api/ethscriptions/[id]/owner","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/ethscriptions\\/([^/]+?)\\/owner\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"ethscriptions","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}],[{"content":"owner","dynamic":false,"spread":false}]],"params":["id"],"component":"src/pages/api/ethscriptions/[id]/owner/index.ts","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[],"routeData":{"route":"/api/ethscriptions/[id]/transfers","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/ethscriptions\\/([^/]+?)\\/transfers\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"ethscriptions","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}],[{"content":"transfers","dynamic":false,"spread":false}]],"params":["id"],"component":"src/pages/api/ethscriptions/[id]/transfers/index.ts","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[],"routeData":{"route":"/api/ethscriptions/[id]","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/ethscriptions\\/([^/]+?)\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"ethscriptions","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/api/ethscriptions/[id]/index.ts","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[],"routeData":{"route":"/api/ethscriptions","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/ethscriptions\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"ethscriptions","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/ethscriptions/index.ts","pathname":"/api/ethscriptions","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[],"routeData":{"route":"/api/exists","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/exists\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"exists","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/exists/index.ts","pathname":"/api/exists","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[],"routeData":{"route":"/api/resolve/[user]/created","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/resolve\\/([^/]+?)\\/created\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"resolve","dynamic":false,"spread":false}],[{"content":"user","dynamic":true,"spread":false}],[{"content":"created","dynamic":false,"spread":false}]],"params":["user"],"component":"src/pages/api/resolve/[user]/created/index.ts","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[],"routeData":{"route":"/api/resolve/[user]/owned","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/resolve\\/([^/]+?)\\/owned\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"resolve","dynamic":false,"spread":false}],[{"content":"user","dynamic":true,"spread":false}],[{"content":"owned","dynamic":false,"spread":false}]],"params":["user"],"component":"src/pages/api/resolve/[user]/owned/index.ts","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[],"routeData":{"route":"/api/resolve/[user]","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/resolve\\/([^/]+?)\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"resolve","dynamic":false,"spread":false}],[{"content":"user","dynamic":true,"spread":false}]],"params":["user"],"component":"src/pages/api/resolve/[user]/index.ts","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[],"routeData":{"route":"/api/search/[input]","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/search\\/([^/]+?)\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"search","dynamic":false,"spread":false}],[{"content":"input","dynamic":true,"spread":false}]],"params":["input"],"component":"src/pages/api/search/[input]/index.ts","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[],"routeData":{"route":"/api/txs/[id]","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/txs\\/([^/]+?)\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"txs","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/api/txs/[id].ts","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/hoisted.Cx-ISqvT.js"},{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[{"type":"external","src":"/_astro/_input_.Fb_eNw7q.css"},{"type":"external","src":"/_astro/_input_.CHdLl6ZZ.css"}],"routeData":{"route":"/pages/404","isIndex":false,"type":"page","pattern":"^\\/pages\\/404\\/?$","segments":[[{"content":"pages","dynamic":false,"spread":false}],[{"content":"404","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/pages/404.astro","pathname":"/pages/404","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/hoisted.Cx-ISqvT.js"},{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[{"type":"external","src":"/_astro/_input_.Fb_eNw7q.css"},{"type":"external","src":"/_astro/_input_.CHdLl6ZZ.css"}],"routeData":{"route":"/tx/[input]","isIndex":false,"type":"page","pattern":"^\\/tx\\/([^/]+?)\\/?$","segments":[[{"content":"tx","dynamic":false,"spread":false}],[{"content":"input","dynamic":true,"spread":false}]],"params":["input"],"component":"src/pages/tx/[input].astro","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[{"type":"external","src":"/_astro/_input_.Fb_eNw7q.css"}],"routeData":{"route":"/[input]","isIndex":false,"type":"page","pattern":"^\\/([^/]+?)\\/?$","segments":[[{"content":"input","dynamic":true,"spread":false}]],"params":["input"],"component":"src/pages/[input].astro","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/hoisted.Cx-ISqvT.js"},{"type":"external","value":"/_astro/page.CY7HCSJH.js"}],"styles":[{"type":"external","src":"/_astro/_input_.Fb_eNw7q.css"},{"type":"external","src":"/_astro/_input_.CHdLl6ZZ.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/home/charlike/github/v2-wiggle/astro-wiggle/src/pages/address/[input].astro",{"propagation":"none","containsHead":true}],["/home/charlike/github/v2-wiggle/astro-wiggle/src/pages/index.astro",{"propagation":"none","containsHead":true}],["/home/charlike/github/v2-wiggle/astro-wiggle/src/pages/pages/404.astro",{"propagation":"none","containsHead":true}],["/home/charlike/github/v2-wiggle/astro-wiggle/src/pages/tx/[input].astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var i=t=>{let e=async()=>{await(await t())()};\"requestIdleCallback\"in window?window.requestIdleCallback(e):setTimeout(e,200)};(self.Astro||(self.Astro={})).idle=i;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var s=(i,t)=>{let a=async()=>{await(await i())()};if(t.value){let e=matchMedia(t.value);e.matches?a():e.addEventListener(\"change\",a,{once:!0})}};(self.Astro||(self.Astro={})).media=s;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var l=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let a of e)if(a.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=l;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000noop-middleware":"_noop-middleware.mjs","/node_modules/astro/dist/assets/endpoint/generic.js":"chunks/pages/generic_Rxl0RXsw.mjs","/src/pages/index.astro":"chunks/pages/index_CckddDFi.mjs","\u0000@astrojs-manifest":"manifest_C0Abboha.mjs","/home/charlike/github/v2-wiggle/astro-wiggle/node_modules/@astrojs/react/vnode-children.js":"chunks/vnode-children_Hb05nn4I.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"chunks/generic_DCaC7FR3.mjs","\u0000@astro-page:src/pages/address/[input]@_@astro":"chunks/_input__ZrKyQeUw.mjs","\u0000@astro-page:src/pages/api/ethscriptions/[id]/content/index@_@ts":"chunks/index_DMdOm-6r.mjs","\u0000@astro-page:src/pages/api/ethscriptions/[id]/creator/index@_@ts":"chunks/index_Ci-rznac.mjs","\u0000@astro-page:src/pages/api/ethscriptions/[id]/number/index@_@ts":"chunks/index_DTciJLpr.mjs","\u0000@astro-page:src/pages/api/ethscriptions/[id]/owner/index@_@ts":"chunks/index_Bbau4e9x.mjs","\u0000@astro-page:src/pages/api/ethscriptions/[id]/transfers/index@_@ts":"chunks/index_CaSicV_r.mjs","\u0000@astro-page:src/pages/api/ethscriptions/[id]/index@_@ts":"chunks/index_BpqUFpjl.mjs","\u0000@astro-page:src/pages/api/ethscriptions/index@_@ts":"chunks/index_B2vCtems.mjs","\u0000@astro-page:src/pages/api/exists/index@_@ts":"chunks/index_DCGnsf1Y.mjs","\u0000@astro-page:src/pages/api/resolve/[user]/created/index@_@ts":"chunks/index_D-Y0LlUB.mjs","\u0000@astro-page:src/pages/api/resolve/[user]/owned/index@_@ts":"chunks/index_CkmhJO90.mjs","\u0000@astro-page:src/pages/api/resolve/[user]/index@_@ts":"chunks/index_h41Kzbz8.mjs","\u0000@astro-page:src/pages/api/search/[input]/index@_@ts":"chunks/index_BUnwnxL3.mjs","\u0000@astro-page:src/pages/api/txs/[id]@_@ts":"chunks/_id__CFjjEjlB.mjs","\u0000@astro-page:src/pages/pages/404@_@astro":"chunks/404_7Th-JA0M.mjs","\u0000@astro-page:src/pages/tx/[input]@_@astro":"chunks/_input__DNH-B_yj.mjs","\u0000@astro-page:src/pages/[input]@_@astro":"chunks/_input__CI-keEV3.mjs","\u0000@astro-page:src/pages/index@_@astro":"chunks/index_hhrZuOB_.mjs","astro:scripts/page.js":"_astro/page.CY7HCSJH.js","/astro/hoisted.js?q=0":"_astro/hoisted.Cx-ISqvT.js","@astrojs/react/client.js":"_astro/client.BgH6ih4s.js","astro:scripts/before-hydration.js":""},"assets":["/_astro/_input_.Fb_eNw7q.css","/_astro/_input_.CHdLl6ZZ.css","/favicon.svg","/_astro/client.BgH6ih4s.js","/_astro/hoisted.Cx-ISqvT.js","/_astro/index.BXBeSuXa.js","/_astro/page.CY7HCSJH.js","/_astro/page.CY7HCSJH.js"],"buildFormat":"directory"});

export { AstroIntegrationLogger as A, Logger as L, getEventPrefix as g, levels as l, manifest };
