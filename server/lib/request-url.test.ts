import { describe, expect, it } from 'vitest'
import { restoreApiPath } from './request-url.js'

describe('restoreApiPath', () => {
  it('leaves regular API URLs untouched', () => {
    expect(restoreApiPath('/api/warehouses?q=ART-001')).toBe('/api/warehouses?q=ART-001')
    expect(restoreApiPath('/api/health')).toBe('/api/health')
    expect(restoreApiPath(undefined)).toBe('/')
  })

  it('rebuilds routes rewritten into a path query parameter', () => {
    expect(restoreApiPath('/api?path=warehouses/abc/layout')).toBe('/api/warehouses/abc/layout')
    expect(restoreApiPath('/api?path=warehouses%2Fabc%2Fsearch&q=ART-001')).toBe('/api/warehouses/abc/search?q=ART-001')
  })
})
