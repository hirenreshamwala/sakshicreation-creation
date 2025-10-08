export type Remark = {
    type: string;
    text: string;
    date: string;
    previousValue?: string;
    assignedPrinterId?: string;
    assignedBinderId?: string;
};

export interface ExpandedRowFormProps {
    row: any;
    setEditData: React.Dispatch<React.SetStateAction<any | null>>;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface InventoryPaper {
    _id: string;
    paperName: string;
    deckal: string;
    gsm: number;
    paperMillName: string;
    kg: number;
    usedKg: number;
    inventoryType: string;
    type: string;
    qpOrder: string | null;
}

export interface PaperOption {
    value: string;
    label: string;
    kg: number;
    usedKg: number;
    availableKg: number;
    isSufficient: boolean;
}

export interface PaperAllocation {
    paperId: string;
    allocatedKg: number;
}

export interface PaperAllocationsResult {
    paper1: {
        allocations: PaperAllocation[];
        remainingRequired: number;
        isSufficient: boolean;
    };
    paper2: {
        allocations: PaperAllocation[];
        remainingRequired: number;
        isSufficient: boolean;
    };
    paper3: {
        allocations: PaperAllocation[];
        remainingRequired: number;
        isSufficient: boolean;
    };
    paperAllocationsMap: Record<string, number>;
}