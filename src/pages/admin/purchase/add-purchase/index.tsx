import QpNewPurchase from '@/component/Purchase/QpPurchase/AddPurchase'
import SakshiNewPurchase from '@/component/Purchase/SakshiPurchase/AddPurchase'
import { useRouter } from 'next/router'
import React from 'react'

function index({ isEditMode = false, purchaseId }: any) {
  const router = useRouter()
  const { type } = router.query
  return (
    <div>
      {type === 1 ? <SakshiNewPurchase isEditMode={isEditMode} purchaseId={purchaseId} /> : <QpNewPurchase />}
    </div>
  )
}

export default index
