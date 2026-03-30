export const CATEGORIES: Record<string, { fiscalYears: string[]; subCategories: string[] }> = {
  'Audit Report': {
    fiscalYears: ['FY 2021-22', 'FY 2022-23', 'FY 2023-24', 'FY 2024-25'],
    subCategories: [],
  },
  'Financial Statements': {
    fiscalYears: ['FY 2022-23', 'FY 2023-24', 'FY 2024-25'],
    subCategories: [],
  },
  'GST Related Documents': {
    fiscalYears: ['FY 2022-23', 'FY 2023-24', 'FY 2024-25', 'FY 2025-26'],
    subCategories: ['GSTR-1', 'GSTR-3B'],
  },
  'Income Tax Documents': {
    fiscalYears: ['FY 2022-23', 'FY 2023-24', 'FY 2024-25'],
    subCategories: ['ITR', 'Acknowledgement', 'Computation'],
  },
  'Incorporation & Other Documents': {
    fiscalYears: [],
    subCategories: [],
  },
}

export const CATEGORY_NAMES = Object.keys(CATEGORIES)

/**
 * Returns all leaf folder placeholder paths for a new client.
 * Firebase Storage has no empty folders, so we create a .keep file at each leaf.
 */
export function getClientFolderPaths(clientName: string): string[] {
  const paths: string[] = []
  for (const [category, config] of Object.entries(CATEGORIES)) {
    if (config.fiscalYears.length === 0) {
      // e.g. Incorporation & Other Documents
      paths.push(`JPCO Client Documents/${clientName}/${category}/.keep`)
    } else if (config.subCategories.length === 0) {
      for (const fy of config.fiscalYears) {
        paths.push(`JPCO Client Documents/${clientName}/${category}/${fy}/.keep`)
      }
    } else {
      for (const fy of config.fiscalYears) {
        for (const sc of config.subCategories) {
          paths.push(`JPCO Client Documents/${clientName}/${category}/${fy}/${sc}/.keep`)
        }
      }
    }
  }
  return paths
}

export function buildStoragePath(
  clientName: string,
  category: string,
  fiscalYear: string | null,
  subCategory: string | null,
  filename: string
): string {
  const parts = ['JPCO Client Documents', clientName, category]
  if (fiscalYear) parts.push(fiscalYear)
  if (subCategory) parts.push(subCategory)
  parts.push(filename)
  return parts.join('/')
}
