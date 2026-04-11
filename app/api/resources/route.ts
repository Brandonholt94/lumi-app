import { NextResponse } from 'next/server'

const WEBFLOW_TOKEN = process.env.WEBFLOW_API_TOKEN
const COLLECTION_ID = process.env.WEBFLOW_RESOURCES_COLLECTION_ID || '69d6b185dd5e975d03bebbe6'
const CATEGORY_COLLECTION_ID = '69d7d60466fcc8a265f08cc5'

export interface ResourceItem {
  id: string
  title: string
  slug: string
  excerpt: string
  thumbnailUrl: string | null
  categoryName: string | null
  url: string
}

async function fetchWebflow(path: string) {
  const res = await fetch(`https://api.webflow.com/v2${path}`, {
    headers: {
      Authorization: `Bearer ${WEBFLOW_TOKEN}`,
      'accept-version': '2.0.0',
    },
    next: { revalidate: 3600 }, // cache 1 hour
  })
  if (!res.ok) throw new Error(`Webflow ${path} → ${res.status}`)
  return res.json()
}

export async function GET() {
  try {
    // Fetch resources + categories in parallel
    const [itemsData, catData] = await Promise.all([
      fetchWebflow(`/collections/${COLLECTION_ID}/items?limit=6`),
      fetchWebflow(`/collections/${CATEGORY_COLLECTION_ID}/items?limit=50`).catch(() => ({ items: [] })),
    ])

    // Build category lookup: id → name
    const categoryMap: Record<string, string> = {}
    for (const cat of catData.items ?? []) {
      categoryMap[cat.id] = cat.fieldData?.name ?? ''
    }

    const resources: ResourceItem[] = (itemsData.items ?? [])
      .filter((item: { isArchived?: boolean; isDraft?: boolean }) => !item.isArchived && !item.isDraft)
      .map((item: {
        id: string
        fieldData: {
          name?: string
          slug?: string
          excerpt?: string
          'thumbnail-image'?: { url?: string }
          category?: string
        }
      }) => {
        const f = item.fieldData ?? {}
        const catId = f.category ?? ''
        return {
          id: item.id,
          title: f.name ?? '',
          slug: f.slug ?? '',
          excerpt: f.excerpt ?? '',
          thumbnailUrl: f['thumbnail-image']?.url ?? null,
          categoryName: categoryMap[catId] ?? null,
          url: `https://lumimind.app/resources/${f.slug ?? ''}`,
        }
      })

    return NextResponse.json({ resources })
  } catch (err) {
    console.error('[/api/resources]', err)
    return NextResponse.json({ resources: [] })
  }
}
