import React from "react";
import { useRouter } from "next/router";
import AddRoleForm from "@/pages/admin/setup/role/add-role";

const EditRolePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  return <AddRoleForm isEditMode={true} roleId={id as string} />;
};

export default EditRolePage;