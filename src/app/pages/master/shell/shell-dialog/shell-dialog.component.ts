import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-shell-dialog',
  templateUrl: './shell-dialog.component.html',
  styleUrls: ['./shell-dialog.component.scss']
})
export class ShellDialogComponent implements OnInit {
  saleForm: FormGroup;
  action: string;
  local_data: any;
  filteredRentProducts: any[] = [];
  categoryList: any[] = [];
    StatusList: any[] = [
    { type: 'Pending' },
    { type: 'Paid' },
    { type: 'Unpaid' }
  ];
 paymentExceeded = false;
  pendingAmount: number = 0;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ShellDialogComponent>,
    private firebaseService : FirebaseService , 
    private loaderService : LoaderService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.local_data = { ...data };
    this.action = this.local_data.action;
  }

  ngOnInit(): void {
    this.buildForm()
    this.getCategoryList();
    if (this.action === 'Edit') {
     this.saleForm.patchValue(this.local_data);
      this.local_data?.companyDetails?.forEach((detail: any, index: number) => {
        if (index > 0) this.addShellDetail();
        const formGroup = this.shellDetails.at(index) as FormGroup;
        if (formGroup) {
          formGroup.patchValue({
            productsName: detail.productsName,
            qty: detail.qty,
            productPrice: detail.productPrice,
            discount: detail.discount,
            subTotal: detail.subTotal,
          });
        }
      });
         this.local_data?.paymentDetails?.forEach((detail: any, index: number) => {
        if (index > 0) this.addpaymentDetail();

        const formGroup = this.paymentDetails.at(index) as FormGroup;
        if (formGroup) {
          const paymentDate = detail.paymentReceivedDate
            ? new Date(detail.paymentReceivedDate.seconds * 1000)
            : null;

          formGroup.patchValue({
            paymentR: detail.paymentR,
            paymentReceivedDate: paymentDate
          });
        }
      });

    }

    if (this.action === 'Add') {
      this.setAutoBillNo();
    }   
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

  calculateSubTotal(group: FormGroup) {
  const qty = Number(group.get('qty')?.value) || 0;
  const price = Number(group.get('productPrice')?.value) || 0;
  const discount = Number(group.get('discount')?.value) || 0; 

  const amount = qty * price;

  const discountAmount = (amount * discount) / 100;

  const subTotal = amount - discountAmount;

  group.get('discountAmount')?.setValue(discountAmount, { emitEvent: false });
  group.get('subTotal')?.setValue(subTotal, { emitEvent: false });

  this.calculateGrandTotal();
}

    calculateGrandTotal() {
    const total = this.shellDetails.controls.reduce((sum, ctrl) => {
      const subTotal = Number((ctrl as FormGroup).get('subTotal')?.value) || 0;
      return sum + subTotal;
    }, 0);

    this.saleForm.get('total')?.setValue(total, { emitEvent: false });
     this.calculateGrandTotalWithExtra();
  }

  calculateGrandTotalWithExtra() {
  const total = Number(this.saleForm.get('total')?.value) || 0;
  const extraDiscounts = Number(this.saleForm.get('extraDiscount')?.value) || 0;

  const grandTotal = total - extraDiscounts;

  this.saleForm.get('grandTotal')?.setValue(grandTotal, { emitEvent: false });
}


    setAutoBillNo() {
    this.firebaseService.getAllShell().subscribe((res: any) => {
      const userId = localStorage.getItem("userId");
      if (res && res.length > 0) {
        const userData = res.filter((item: any) => item.userId === userId);
        this.saleForm.get('invoiceNo')?.setValue(userData.length + 1);
      } else {
        this.saleForm.get('invoiceNo')?.setValue(1);
      }
    });
  }

  buildForm() {
    this.saleForm = this.fb.group({
      billNumber: [0],
      invoiceNo: [0],
      date: [new Date()],
      customerName: [''],
      mobileNumber: [''],
      customerAddress: [''],
      extraDiscount: [0],
      total: [''],
      grandTotal: [''],
      paymentReceived: [false],
     paymentStatus: ['Unpaid', Validators.required],
     shellDetails: this.fb.array([this.createSaleDetailGroup()]),
     paymentDetails: this.fb.array([this.createpaymentDetailGroup()])

    })
      this.saleForm.get('extraDiscount')?.valueChanges.subscribe(() => {
    this.calculateGrandTotalWithExtra();
  });
  }

   createSaleDetailGroup(): FormGroup {
   const group = this.fb.group({
      productsName: ['',],
      qty: ['',],
      productPrice: [0,],
      discount: [0,],
      subTotal: [0,],
    });
     group.valueChanges.subscribe(() => {
      this.calculateSubTotal(group);
    });

    return group;
  }


   addShellDetail() {
    this.shellDetails.push(this.createSaleDetailGroup());
  }

   removeShellDetail(index: number) {
    this.shellDetails.removeAt(index);
  }

    get shellDetails(): FormArray {
    return this.saleForm.get('shellDetails') as FormArray;
  }


  createpaymentDetailGroup(): FormGroup {
    const group = this.fb.group({
      paymentR: [, Validators.min(0)],
      paymentReceivedDate: [new Date()]
    });
    return group;
  }

   removepaymentDetail(index: number) {
    this.paymentDetails.removeAt(index);
  }

  addpaymentDetail() {
    if (this.paymentExceeded) return;
    this.paymentDetails.push(this.createpaymentDetailGroup());
  }

  get paymentDetails(): FormArray {
    return this.saleForm.get('paymentDetails') as FormArray;
  }




  shellPayload(): void {
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      billNumber: this.saleForm.value.billNumber,
      invoiceNo: this.saleForm.value.invoiceNo,
      date: this.saleForm.value.date,
      customerName: this.saleForm.value.customerName,
      mobileNumber: this.saleForm.value.mobileNumber,
      customerAddress: this.saleForm.value.customerAddress,
      total: this.saleForm.value.total,
      extraDiscount: this.saleForm.value.extraDiscount,
      grandTotal: this.saleForm.value.grandTotal,
      paymentStatus: this.saleForm.value.paymentStatus,
       shellDetails: this.saleForm.value.shellDetails,
        paymentDetails: this.saleForm.value.paymentDetails
    }
    this.dialogRef.close({ event: this.action, data: payload })    

  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }


   

   getCategoryList() {
    this.loaderService.setLoader(true);

    this.firebaseService.getAllCategory().subscribe((res: any) => {
      if (res) {
        this.categoryList = res.filter((id: any) => id.userId === localStorage.getItem('userId'));
      }
      this.loaderService.setLoader(false);
    });
  }
}