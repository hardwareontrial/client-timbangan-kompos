import type { App } from 'vue'

import { setupLayouts } from 'virtual:generated-layouts'
import type { RouteRecordRaw } from 'vue-router/auto'
// eslint-disable-next-line import/no-unresolved
import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router/auto'

function recursiveLayouts(route: RouteRecordRaw): RouteRecordRaw {
  if (route.children) {
    for (let i = 0; i < route.children.length; i++)
      route.children[i] = recursiveLayouts(route.children[i])

    return route
  }

  return setupLayouts([route])[0]
}

const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior(to) {
    if(to.hash) {
      return { el: to.hash, top: 60 }
    }
  },
  extendRoutes: pages => [
    ...[...pages].map(route => recursiveLayouts(route))
  ],
});

export { router }

export default function (app: App) {
  app.use(router)
}
