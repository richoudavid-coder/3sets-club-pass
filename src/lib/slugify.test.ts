import { describe, expect, it } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('normalise les accents et espaces', () => {
    expect(slugify('Tennis Club de Plouzané')).toBe('tennis-club-de-plouzane')
  })
  it('retire les caractères dangereux pour une URL', () => {
    expect(slugify('Club / Test ? 2027')).toBe('club-test-2027')
  })
})
