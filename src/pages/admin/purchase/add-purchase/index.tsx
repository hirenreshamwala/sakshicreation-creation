import QpNewPurchase from '@/component/Purchase/QpPurchase/AddPurchase'
import SakshiNewPurchase from '@/component/Purchase/SakshiPurchase/AddPurchase'
import { useRouter } from 'next/router'
import React from 'react'

function Index({ isEditMode = false, purchaseId }: any) {
  const router = useRouter()
  const { type } = router.query

  // ⛔ Jab tak query ready nahi, kuch render mat karo
  if (!router.isReady) {
    return null // ya loader
  }

  return (
    <div>
      {type === "1" ? (
        <QpNewPurchase />
      ) : (
        <SakshiNewPurchase
          isEditMode={isEditMode}
          purchaseId={purchaseId}
        />
      )}
    </div>
  )
}

export default Index
