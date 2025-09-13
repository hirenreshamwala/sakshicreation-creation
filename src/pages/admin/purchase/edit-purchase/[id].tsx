import EditQpPurchasePage from '@/component/Purchase/QpPurchase/EditPurchase';
import EditSakshiPurchasePage from '@/component/Purchase/SakshiPurchase/EditPurchase'
import { useRouter } from 'next/router';
import React from 'react'

function index() {
  const router = useRouter()
  const { id, type } = router.query;
  console.log(id, type,'id, type')
  return (
    <div>
      {type === 1 ? <EditQpPurchasePage id={id} /> : <EditSakshiPurchasePage id={id} />}
    </div>
  )
}

export default index
