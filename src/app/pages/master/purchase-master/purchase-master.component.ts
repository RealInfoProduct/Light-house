import { Component, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { ExpensesList, PurchaseList } from 'src/app/interface/invoice';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { PurchaseMasterDialogComponent } from './purchase-master-dialog/purchase-master-dialog.component';
import { ViewcompanyComponent } from './viewcompany/viewcompany.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';
import { PaymentDetailsComponent } from './payment-details/payment-details.component';


@Component({
  selector: 'app-purchase-master',
  templateUrl: './purchase-master.component.html',
  styleUrls: ['./purchase-master.component.scss']
})
export class PurchaseMasterComponent implements OnInit {
  datePurchaseListForm: FormGroup;

  displayedColumns: string[] = [
    'srno',
    'billNo',
    'PartyName',
    'date',
    'status',
    'finalAmount',
    'recivedAmount',
    'pendingAmount',
    'action',
  ];
  purchaseList: any = []
  partyList: any = []
  categoryList: any = []
  incomeExpenseList: any[] = []
  balanceList: any = []

     partys: any[] = [];
    partyWisePurchase: any = {};

  productDataSource = new MatTableDataSource(this.purchaseList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);
   @ViewChildren(MatPaginator) paginators!: QueryList<MatPaginator>;
    @ViewChild('tabGroup') tabGroup: any;

  constructor(private dialog: MatDialog,
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    private _snackBar: MatSnackBar,) { }


  ngOnInit(): void {
    this.getpurchaseList()
    this.getPartyList()
    this.getCategoryList()
    // this.SearchFilter()
    this.dateform()
    this.getExpensesList()
    this.getBalanceList()
  }

  dateform() {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.datePurchaseListForm = this.fb.group({
      start: [startDate],
      end: [endDate]
    });
  }

  // filterDate() {
  //   if (!this.purchaseList) return;
  //   const startDate = this.datePurchaseListForm.value.start ? new Date(this.datePurchaseListForm.value.start) : null;
  //   const endDate = this.datePurchaseListForm.value.end ? new Date(this.datePurchaseListForm.value.end) : null;

  //   if (startDate && endDate) {
  //     this.productDataSource.data = this.purchaseList.filter((invoice: any) => {
  //       if (!invoice.date) return false;

  //       let invoiceDate;
  //       if (invoice.date.toDate) {
  //         invoiceDate = invoice.date.toDate();
  //       } else if (invoice.date instanceof Date) {
  //         invoiceDate = invoice.date;
  //       } else {
  //         return false;
  //       }

  //       return invoiceDate >= startDate && invoiceDate <= endDate;
  //     });
  //   } else {
  //     this.productDataSource.data = this.purchaseList;
  //   }
  // }

   filterDate() {
      if (!this.purchaseList) return;
  
      const start = this.datePurchaseListForm.value.start;
      const end = this.datePurchaseListForm.value.end;
  
      if (!start || !end) {
        this.getpurchaseList() // reset
        return;
      }
  
      const startDate = new Date(start);
      const endDate = new Date(end);
  
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
  
      Object.keys(this.partyWisePurchase).forEach((partyId: string) => {
  
        const originalData = this.purchaseList.filter((x: any) => x.isParty === partyId);
        const filteredData = originalData.filter((invoice: any) => {
  
          if (!invoice.date) return false;
  
          let invoiceDate: Date;
  
          // ✅ IMPORTANT: Your HTML uses Angular date pipe → means it's already a Date
          if (invoice.date instanceof Date) {
            invoiceDate = invoice.date;
          } else {
            invoiceDate = new Date(invoice.date);
          }
  
          if (isNaN(invoiceDate.getTime())) return false;
  
          invoiceDate.setHours(0, 0, 0, 0);
  
          return invoiceDate >= startDate && invoiceDate <= endDate;
        });
  
        this.partyWisePurchase[partyId].data = filteredData;
  
        // 🔥 Force table refresh (VERY IMPORTANT)
        this.partyWisePurchase[partyId]._updateChangeSubscription();
      });
    }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Paid':
        return 'status-paid';
      case 'Unpaid':
        return 'status-unpaid';
      case 'Pending':
        return 'status-pending';
      default:
        return '';
    }
  }

  getPendingAmount(element: any): number {
    if (!element.total) return 0;
    return element.paymentDetails
      ? element.total - this.getTotalReceived(element.paymentDetails)
      : element.total;
  }

  getFinalStatus(element: any): string {
    return this.getPendingAmount(element) === 0 ? 'Paid' : element.paymentStatus;
  }



  // applyFilter(filterValue: string): void {
  //   this.productDataSource.filter = filterValue.trim().toLowerCase();
  //   this.SearchFilter()
  // }

  // SearchFilter() {
  //   this.productDataSource.filterPredicate = (data: any, filter: string) => {
  //     const searchText = filter.trim().toLowerCase();
  //     const billNo = data.billNo?.toString().toLowerCase() || '';
  //     const status = data.paymentStatus?.toLowerCase() || '';

  //     const partyName =
  //       this.partyList.find((p: any) => p.id === data.isParty)?.partyName
  //         ?.toLowerCase() || '';

  //     return (
  //       billNo.includes(searchText) ||
  //       status.includes(searchText) ||
  //       partyName.includes(searchText)
  //     );
  //   };
  // }

  applyFilter(filterValue: string): void {
    const filter = filterValue.trim().toLowerCase();

    Object.keys(this.partyWisePurchase).forEach((key: string) => {

      const dataSource = this.partyWisePurchase[key];

      // ✅ Set predicate for EACH table
      dataSource.filterPredicate = (data: any, filter: string) => {

        const searchText = filter.trim().toLowerCase();
        const billNumber = data.billNo?.toString().toLowerCase() || '';
        const partyName =
        this.partyList.find((p: any) => p.id === data.isParty)?.partyName
        ?.toLowerCase() || '';

        return (
          billNumber.includes(searchText) ||
          partyName.includes(searchText)
        );
      };

      // ✅ Apply filter
      dataSource.filter = filter;

      // 🔥 Force refresh (important)
      dataSource._updateChangeSubscription();
    });
  }

  async updateBalance(paymentDetails: any[], reverse: boolean = false) {
    if (!this.balanceList || !paymentDetails?.length) return;

    for (const payment of paymentDetails) {
      const amount = Number(payment.paymentR) || 0;
      const finalAmount = reverse ? amount : -amount;

      if (payment.paymentType === 'Cash') {
        this.balanceList.cashBalance =
          (this.balanceList.cashBalance || 0) + finalAmount;
      }

      else if (payment.bankName) {
        const bank = this.balanceList.bankDetails?.find(
          (b: any) => b.id === payment.bankName
        );

        if (bank) {
          bank.balance = (bank.balance || 0) + finalAmount;
        }
      }
    }

    await this.firebaseService.updateBalance(
      this.balanceList.id,
      this.balanceList
    );
  }


  addPurchase(action: string, obj: any) {
    obj.action = action;
    const dialogRef = this.dialog.open(PurchaseMasterDialogComponent, { data: obj });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result?.event) return;


      const updateStock = async (categoryId: string, countChange: number) => {
        const categoryItem = this.categoryList.find((cat: any) => cat.id === categoryId);
        if (categoryItem) {
          categoryItem.stockCount = (categoryItem.stockCount || 0) + countChange;
          await this.firebaseService.updateCategory(categoryItem.id, categoryItem);
        }
      };

      if (result.event === 'Add') {
        const payload: PurchaseList = {
          id: '',
          billNo: result.data.billNo,
          isParty: result.data.isParty.id,
          date: result.data.date,
          paymentStatus: result.data.paymentStatus,
          total: result.data.total,
          paymentReceived: result.data.paymentReceived,
          type: result.data.type,
          paymentDays: Number(result.data.paymentDays),
          otherKharch: result.data.otherKharch,
          companyDetails: result.data.companyDetails.map((detail: any) => ({
            companyName: detail.companyName.id,
            category: detail.category.id,
            purchasePrice: detail.purchasePrice,
            itemCount: detail.itemCount,
            subTotal: detail.subTotal,
          })),
          paymentDetails: result.data.paymentDetails.map((detail: any) => ({
            paymentR: detail.paymentR,
            paymentReceivedDate: detail.paymentReceivedDate,
            paymentType: detail.paymentType,
            bankName: detail.bankName?.id || ''
          })),
          userId: localStorage.getItem("userId")
        };

        for (const detail of payload.companyDetails) {
          await updateStock(detail.category, detail.itemCount);
        }

        await this.updateBalance(payload.paymentDetails);

        await this.firebaseService.addPurchase(payload);

        const expensePayload: ExpensesList = {
          id: '',
          date: result.data.date,
          billNo: result.data.billNo,
          amount: result.data.total,
          notes: result.data.isParty.id || '',
          paymentStatus: result.data.paymentDetails?.[0]?.paymentType || 'Cash',
          accounttype: result.data.type || '',
          status: result.data.paymentStatus,
          userId: localStorage.getItem("userId"),
        };

        await this.firebaseService.addExpenses(expensePayload);

        this.getpurchaseList();
        this.getBalanceList();
        this.getExpensesList();
        this.openConfigSnackBar('Record created successfully');
      }
      if (result.event === 'Edit') {

        const oldPurchase = this.purchaseList.find((el: any) => el.id === result.data.id);

        if (!oldPurchase) return;

        await this.updateBalance(oldPurchase.paymentDetails, true);

        for (const oldDetail of oldPurchase.companyDetails) {
          await updateStock(oldDetail.category, -oldDetail.itemCount);
        }

        const payload: PurchaseList = {
          id: result.data.id,
          billNo: result.data.billNo,
          isParty: result.data.isParty.id,
          date: result.data.date,
          paymentStatus: result.data.paymentStatus,
          total: result.data.total,
          paymentReceived: result.data.paymentReceived,
          type: result.data.type,
          paymentDays: Number(result.data.paymentDays),
          otherKharch: result.data.otherKharch,
          companyDetails: result.data.companyDetails.map((detail: any) => ({
            companyName: detail.companyName.id,
            category: detail.category.id,
            purchasePrice: detail.purchasePrice,
            itemCount: detail.itemCount,
            subTotal: detail.subTotal
          })),
          paymentDetails: result.data.paymentDetails.map((detail: any) => ({
            paymentR: detail.paymentR,
            paymentReceivedDate: detail.paymentReceivedDate,
            paymentType: detail.paymentType,
            bankName: detail.bankName?.id || ''
          })),
          userId: localStorage.getItem('userId')
        };

        const oldExpense = this.incomeExpenseList.find(
          (el: any) => el.billNo === result.data.billNo 
        );
        
        const expensePayload: ExpensesList = {
          id: oldExpense ? oldExpense.id : '',
          date: result.data.date,
          billNo: result.data.billNo,
          amount: result.data.total,
          notes: result.data.isParty?.id || '',
          paymentStatus:
            result.data.paymentDetails?.[0]?.paymentType || 'Cash',
          accounttype: result.data.type || '',
          status: result.data.paymentStatus,
          userId: localStorage.getItem('userId')
        };

        if (oldExpense) {
          await this.firebaseService.updateExpenses(
            oldExpense.id,
            expensePayload
          );
        } else {
          await this.firebaseService.addExpenses(expensePayload);
        }

        for (const detail of payload.companyDetails) {
          await updateStock(detail.category, detail.itemCount);
        }

        await this.updateBalance(payload.paymentDetails);

        await this.firebaseService.updatePurchase(result.data.id, payload);

        this.getpurchaseList();
        this.getBalanceList();
        this.openConfigSnackBar('Record updated successfully');
      }
      if (result.event === 'Delete') {
        const oldPurchase = this.purchaseList.find((el: any) => el.id === result.data.id);
        if (!oldPurchase) return;

        await this.updateBalance(oldPurchase.paymentDetails, true);

        for (const detail of oldPurchase.companyDetails) {
          await updateStock(detail.category, -detail.itemCount);
        }
        const oldExpense = this.incomeExpenseList.find(
          (el: any) => el.billNo === oldPurchase.billNo
        );

        await this.firebaseService.deletePurchase(result.data.id);
        if (oldExpense) {
          await this.firebaseService.deleteExpenses(oldExpense.id);
        }

        this.getpurchaseList();
        this.getBalanceList();
        this.openConfigSnackBar('Record deleted successfully');
      }

    });
  }



  updateCategory(category: any, data: any) {
    return this.firebaseService.updateCategory(category, data);
  }


  viewcompanyDetails(obj: any) {
    const dialogRef = this.dialog.open(ViewcompanyComponent, { data: obj });

  }

  paymentDetails(obj: any) {
    const dialogRef = this.dialog.open(PaymentDetailsComponent, { data: obj });

  }

  getpurchaseList() {
    this.loaderService.setLoader(true);

    this.firebaseService.getAllPurchase().subscribe((res: any) => {
      if (res) {

        this.purchaseList = res
          .filter((id: any) => id.userId === localStorage.getItem("userId"))
          .map((item: any) => ({
            ...item,
            date: this.parseDate(item.date)
          }));

        this.setPaymentStatus(this.purchaseList)
      }
      // this.productDataSource = new MatTableDataSource(this.purchaseList);
      // this.productDataSource.paginator = this.paginator;
      const uniquepartyIds = [...new Set(this.purchaseList.map((x: any) => x.isParty))] as string[];
      // Tabs
      this.partys = uniquepartyIds.map((id: string) => {
        const party = this.getpartyName(id);
        return {
          partyId: id,
          name: party?.header || 'Firm ' + id
        };
      });
      
      // Group data
      this.partyWisePurchase = {};
        uniquepartyIds.forEach((id: string) => {
          const data = this.purchaseList.filter((x: any) => x.isParty === id)
          .sort((a: any, b: any) => b.billNo - a.billNo); 
          this.partyWisePurchase[id] = new MatTableDataSource(data);
        });
        this.loaderService.setLoader(false)
        setTimeout(() => this.assignPaginators());
        
        this.filterDate()
      })
      this.loaderService.setLoader(false);
  }

    assignPaginators() {
    const paginatorArray = this.paginators.toArray();

    this.partys.forEach((party, index) => {
      const ds = this.partyWisePurchase[party.partyId];
      if (ds) {
        ds.paginator = paginatorArray[index];
      }
    });
  }

  parseDate(dateValue: any): Date {

    if (dateValue && dateValue.seconds) {
      return new Date(dateValue.seconds * 1000);
    }

    if (dateValue instanceof Date) {
      return dateValue;
    }

    if (typeof dateValue === 'string') {
      const cleaned = dateValue.replace(" at ", " ");
      return new Date(cleaned);
    }

    return new Date(dateValue);
  }

  getBalanceList() {
    this.loaderService.setLoader(true);

    this.firebaseService.getAllBalance().subscribe((res: any[]) => {
      if (res) {
        this.balanceList = res.find(
          item => item.userId === localStorage.getItem('userId')
        );

      }
      this.loaderService.setLoader(false);
    });
  }

  getPartyList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllParty().subscribe((res: any) => {
      if (res) {
        this.partyList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.loaderService.setLoader(false)
      }
    })
  }

  getpartyName(partyid: any) {
    return this.partyList.find((id: any) => id.id === partyid)?.partyName
  }

  getExpensesList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllExpenses().subscribe((res: any) => {
      if (res) {
        this.incomeExpenseList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.loaderService.setLoader(false)
      }
    })
  }

  getCategoryList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllCategory().subscribe((res: any) => {
      if (res) {
        this.categoryList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.loaderService.setLoader(false)
      }
    })
  }

  getcompanyname(companyid: any) {
    return this.categoryList.find((id: any) => id.id === companyid)?.companyName
  }

  getcategory(categoryid: any) {
    return this.categoryList.find((id: any) => id.id === categoryid)?.category
  }

  getsubcategory(keySpecifiCationsid: any) {
    return this.categoryList.find((id: any) => id.id === keySpecifiCationsid)?.keySpecifiCations
  }


  openConfigSnackBar(snackbarTitle: any) {
    this._snackBar.open(snackbarTitle, 'Splash', {
      duration: 2 * 1000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  setPaymentStatus(data: any[]) {
    data.forEach(element => {
      const total = Number(element.total) || 0;
      const received = Number(element.paymentDetails?.[0]?.paymentR) || 0;

      if (total === received && total > 0) {
        element.paymentStatus = 'Paid';
      } else if (received > 0 && received < total) {
        element.paymentStatus = 'Pending';
      } else {
        element.paymentStatus = 'Unpaid';
      }
    });
  }

  getTotalReceived(paymentDetails: any[]): number {
    if (!paymentDetails || paymentDetails.length === 0) {
      return 0;
    }
    return paymentDetails.reduce((sum, item) => sum + (item.paymentR || 0), 0);
  }

  // filedownload() {
  //   const doc: any = new jsPDF();
  //   doc.setFontSize(13);
  //   const filteredData: any[] = this.productDataSource.data;

  //   if (!filteredData || filteredData.length === 0) {
  //     window.alert("No Purchase data available for the selected filters.");
  //     return;
  //   }

  //   const startDate = this.datePurchaseListForm.value.start;
  //   const endDate = this.datePurchaseListForm.value.end;

  //   const formattedStart = new Date(startDate).toLocaleDateString('en-GB');
  //   const formattedEnd = new Date(endDate).toLocaleDateString('en-GB');

  //   doc.text(`Report Date: ${formattedStart} To ${formattedEnd}`, 14, 15);

  //   const TotalAmounttotal = filteredData.reduce((sum, item) => sum + parseFloat(item.total), 0);
  //   const FinalTotalAmount = Math.round(TotalAmounttotal).toLocaleString('en-IN', {
  //     minimumFractionDigits: 2,
  //     maximumFractionDigits: 2
  //   });
  //   doc.text(`Final Total: ${(FinalTotalAmount)}`, 135, 11);

  //   const RecivedtotalAmount = filteredData.reduce((sum: number, item: any) => {
  //     if (item.paymentDetails && Array.isArray(item.paymentDetails)) {
  //       return sum + item.paymentDetails.reduce((innerSum: number, pd: any) => innerSum + (parseFloat(pd.paymentR) || 0), 0);
  //     }
  //     return sum;
  //   }, 0);
  //   const RecivedAmount = Math.round(RecivedtotalAmount).toLocaleString('en-IN', {
  //     minimumFractionDigits: 2,
  //     maximumFractionDigits: 2
  //   });
  //   doc.text(`Spent Total: ${(RecivedAmount)}`, 135, 19);

  //   const PendingtotalAmount = filteredData.reduce((sum: number, item: any) => {
  //     const paymentReceived = item.paymentDetails?.reduce(
  //       (innerSum: number, pd: any) => innerSum + (parseFloat(pd.paymentR) || 0),
  //       0
  //     ) || 0;
  //     const totalAmount = item.total || 0;
  //     return sum + (totalAmount - paymentReceived);
  //   }, 0);

  //   const PendingAmount = Math.round(PendingtotalAmount).toLocaleString('en-IN', {
  //     minimumFractionDigits: 2,
  //     maximumFractionDigits: 2
  //   });

  //   doc.text(`Pending Total: ${PendingAmount}`, 135, 27);

  //   const headers = [
  //     "Sr.No",
  //     "Bill No",
  //     "Party Name",
  //     "Date",
  //     "Status",
  //     "Amount Final",
  //     "Amount Spent",
  //     "Pending Amount"
  //   ];

  //   const data = filteredData.map((item, i) => {
  //     const partyName = this.partyList.find((prod: any) => prod.id === item.isParty)?.partyName || '';

  //     const dateStr = moment(item.date).format('DD/MM/YYYY');

  //     const paymentReceived = item.paymentDetails.reduce(
  //       (sum: number, pd: any) => sum + (pd.paymentR || 0),
  //       0
  //     );

  //     const totalAmount = item.total || 0;

  //     const pendingAmount = totalAmount - paymentReceived;
  //     return [
  //       i + 1,
  //       item.billNo,
  //       partyName,
  //       dateStr,
  //       item.paymentStatus,
  //       totalAmount,
  //       paymentReceived,
  //       pendingAmount
  //     ];
  //   });

  //   const MIN_ROWS = 35;
  //   if (data.length < MIN_ROWS) {
  //     for (let idx = data.length; idx < MIN_ROWS; idx++) {
  //       data.push([
  //         idx + 1,
  //         '',
  //         '',
  //         '',
  //         '',
  //         ''
  //       ]);
  //     }
  //   }

  //   doc.setFontSize(10);
  //   (doc as any).autoTable({
  //     head: [headers],
  //     body: data,
  //     startY: 32,
  //     theme: 'grid',
  //     headStyles: {
  //       fillColor: [255, 187, 0],
  //       textColor: [8, 8, 8],
  //       fontStyle: 'bold'
  //     },
  //     styles: {
  //       textColor: [8, 8, 8],
  //       fontSize: 8,
  //       valign: 'middle',
  //       halign: 'center'
  //     }
  //   });

  //   doc.save(`Shell Report.pdf`);
  // }

  filedownload() {
  if (!this.tabGroup) {
    this.openConfigSnackBar('Tab not initialized');
    return;
  }

  const selectedIndex = this.tabGroup.selectedIndex;

  if (selectedIndex === null || selectedIndex === undefined) {
    this.openConfigSnackBar('No tab selected');
    return;
  }

  const party = this.partys[selectedIndex];

  if (!party) {
    this.openConfigSnackBar('Party not found');
    return;
  }

  const ds = this.partyWisePurchase[party.partyId];

  if (!ds) {
    this.openConfigSnackBar('No data source found');
    return;
  }

  // ✅ Safe data selection
  const filteredData = (ds.filteredData && ds.filteredData.length)
    ? ds.filteredData
    : ds.data;

  if (!filteredData || filteredData.length === 0) {
    window.alert("No Purchase data available for the selected filters.");
    return;
  }

  const doc: any = new jsPDF();
  doc.setFontSize(12);

  // ✅ Date
  const startDate = new Date(this.datePurchaseListForm.value.start);
  const endDate = new Date(this.datePurchaseListForm.value.end);

  const formattedStart = startDate.toLocaleDateString('en-GB');
  const formattedEnd = endDate.toLocaleDateString('en-GB');

  const firmName = this.getpartyName(party.partyId) || '';

  doc.text(`Party Name: ${firmName}`, 14, 12);
  doc.text(`Report Date: ${formattedStart} To ${formattedEnd}`, 14, 18);

  // ✅ Totals
  const TotalAmounttotal = filteredData.reduce(
    (sum:any, item:any) => sum + parseFloat(item.total || 0), 0
  );

  const FinalTotalAmount = Math.round(TotalAmounttotal).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  doc.text(`Final Total: ${FinalTotalAmount}`, 135, 11);

  const RecivedtotalAmount = filteredData.reduce((sum: number, item: any) => {
    if (item.paymentDetails && Array.isArray(item.paymentDetails)) {
      return sum + item.paymentDetails.reduce(
        (innerSum: number, pd: any) => innerSum + (parseFloat(pd.paymentR) || 0),
        0
      );
    }
    return sum;
  }, 0);

  const RecivedAmount = Math.round(RecivedtotalAmount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  doc.text(`Spent Total: ${RecivedAmount}`, 135, 19);

  const PendingtotalAmount = filteredData.reduce((sum: number, item: any) => {
    const paymentReceived = item.paymentDetails?.reduce(
      (innerSum: number, pd: any) => innerSum + (parseFloat(pd.paymentR) || 0),
      0
    ) || 0;

    const totalAmount = item.total || 0;

    return sum + (totalAmount - paymentReceived);
  }, 0);

  const PendingAmount = Math.round(PendingtotalAmount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  doc.text(`Pending Total: ${PendingAmount}`, 135, 27);

  // ✅ Table Headers
  const headers = [
    "Sr.No",
    "Bill No",
    "Party Name",
    "Date",
    "Status",
    "Amount Final",
    "Amount Spent",
    "Pending Amount"
  ];

  // ✅ Table Data
  const data = filteredData.map((item:any, i:any) => {
    const partyName = this.partyList.find(
      (prod: any) => prod.id === item.isParty
    )?.partyName || '';

    const dateStr = moment(item.date).format('DD/MM/YYYY');

    const paymentReceived = item.paymentDetails?.reduce(
      (sum: number, pd: any) => sum + (pd.paymentR || 0),
      0
    ) || 0;

    const totalAmount = item.total || 0;

    const pendingAmount = totalAmount - paymentReceived;

    return [
      i + 1,
      item.billNo || '',
      partyName,
      dateStr,
      item.paymentStatus || '',
      totalAmount,
      paymentReceived,
      pendingAmount
    ];
  });

  // ✅ Minimum rows fix
  const MIN_ROWS = 35;
  while (data.length < MIN_ROWS) {
    data.push(['', '', '', '', '', '', '', '']);
  }

  doc.setFontSize(10);

  (doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 32,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 187, 0],
      textColor: [8, 8, 8],
      fontStyle: 'bold'
    },
    styles: {
      textColor: [8, 8, 8],
      fontSize: 8,
      valign: 'middle',
      halign: 'center'
    }
  });

  doc.save(`Shell Report.pdf`);
}

}

