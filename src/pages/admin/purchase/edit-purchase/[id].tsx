import EditQpPurchasePage from '@/component/Purchase/QpPurchase/EditPurchase'
import EditSakshiPurchasePage from '@/component/Purchase/SakshiPurchase/EditPurchase'
import { useRouter } from 'next/router'
import React from 'react'

function PurchaseEditPage() {
  const router = useRouter()
  const { id, type } = router.query

  // Convert type to string (router.query always gives string | string[] | undefined)
  const typeValue = Array.isArray(type) ? type[0] : type

  if (!id) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {typeValue === '1' ? (
        <EditQpPurchasePage id={id as string} />
      ) : (
        <EditSakshiPurchasePage id={id as string} />
      )}
    </div>
  )
}

export default PurchaseEditPage
