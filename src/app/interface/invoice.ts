
export interface AuthResponse {
    idToken: string,
    email: string,
    refreshToken: string,
    expiresIn: string,
    localId: string
    registerd?: boolean
}

export interface RegisterUser {
    id: string,
    email: any,
    password: any,
    isActive: boolean
}

export interface PartyList {
    id: string,
    partyName: string,
    partyAddress: string,
    partyGstNo: string,
    partyPanNo: string,
    partyMobileNo: Number,
    isFirm: string,
    userId: any
}

export interface PurchaseList {
    id: string;
    billNo: number;
    isParty: string;
    date: string;
    paymentStatus: string;
    total: number;
    userId: string | null;
    paymentReceived: string;
    companyDetails: {
        companyName: string;
        category: string;
        purchasePrice: number;
        itemCount: number;
        total: number;
    }[];
    paymentDetails: {
        paymentReceivedDate: string;
        paymentR: number;
    }[];
}

export interface CategoryList {
    id: string,
    companyName: string,
    category: string,
    mode: Number,
    keySpecifiCations: string,
    warrantyPeriods: Number,
    stockCount: string,
    userId: any
}

export interface FirmList {
    id: string,
    header: string,
    subHeader: string,
    address: string,
    gstNo: string,
    panNo: string,
    mobileNo: Number,
    personalMobileNo: Number,
    bankName: string,
    accountholdersname: string,
    bankIfsc: string,
    bankAccountNo: string,
    isInvoiceTheme: string,
    userId: any
}



export interface ShellList {
    id: string,
    billNumber: number,
    invoiceNo: number,
    date: string,
    customerName: string,
    mobileNumber: string,
    customerAddress: string,
    total:number,
    extraDiscount :number,
    grandTotal :number,
    paymentStatus :string,
    userId: any,
    shellDetails: {
       productsName:string,
       qty: number,
       prouctPrice: number,
       discount: number,
       finalTotal:number
    }[];
     paymentDetails: {
        paymentReceivedDate: string;
        paymentR: number;
    }[];
}

