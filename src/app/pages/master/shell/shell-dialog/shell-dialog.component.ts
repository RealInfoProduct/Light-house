import { Component, Inject, OnInit, Optional } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
  companyList: any[] = [];
  categoryList: any[] = [];
   balanceList: any = [];
  StatusList: any[] = [
    { type: 'Pending' },
    { type: 'Paid' },
    { type: 'Unpaid' }
  ];

  paymenttype: any = [
    'Cash',
    'G-Pay'
  ]

  paymentExceeded = false;
  pendingAmount: number = 0;
  filteredCategoryList: any[] = [];
  selectedStock: number[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ShellDialogComponent>,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.local_data = { ...data };
    this.action = this.local_data.action;
  }

  ngOnInit(): void {
    this.buildForm()
    this.getCategoryList();
    this.calculatePending();
    this.getBalanceList();
    
    if (this.action === 'Edit') {
      this.saleForm.patchValue(this.local_data);
      this.local_data.shellDetails.forEach((detail: any, index: number) => {
        if (index > 0) this.addShellDetail();
        const formGroup = this.shellDetails.at(index) as FormGroup;
        if (formGroup) {
          const SaleDate = detail.saleDate
            ? new Date(detail.saleDate.seconds * 1000)
            : null;
          formGroup.patchValue({
            saleDate: SaleDate,
            companyName: detail.companyName,
            category: detail.category,
            qty: detail.qty,
            productPrice: detail.productPrice,
            discount: detail.discount,
            subTotal: detail.subTotal,
          });
        }
      });
      // this.local_data.paymentDetails.forEach((detail: any, index: number) => {
      //   if (index > 0) this.addpaymentDetail();

      //   const formGroup = this.paymentDetails.at(index) as FormGroup;
      //   if (formGroup) {
      //     const paymentDate = detail.paymentReceivedDate
      //       ? new Date(detail.paymentReceivedDate.seconds * 1000)
      //       : null;

      //     formGroup.patchValue({
      //       paymentR: detail.paymentR,
      //       paymentReceivedDate: paymentDate,
      //       paymentType: detail.paymentType
      //     });
      //   }
      // });
    }

    if (this.action === 'Add') {
      this.setAutoBillNo();
    }

    this.saleForm.valueChanges.subscribe(() => {
      this.calculatePending();
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

  calculateSubTotal(group: FormGroup) {
    const qty = Number(group.get('qty')?.value) || 0;
    const price = Number(group.get('productPrice')?.value) || 0;
    const discount = Number(group.get('discount')?.value) || 0;

    const amount = qty * price;

    const discountAmount = (amount * discount) / 100;

    const subTotal = Math.round(amount - discountAmount);

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

  calculatePending() {
    const grandTotal = Number(this.saleForm.get('grandTotal')?.value) || 0;

    const paidTotal = this.paymentDetails.controls.reduce((sum, group) => {
      return sum + (Number(group.get('paymentR')?.value) || 0);
    }, 0);

    this.pendingAmount = grandTotal - paidTotal;

    if (this.pendingAmount === 0 && grandTotal > 0) {
      this.saleForm.get('paymentStatus')?.setValue('Paid', { emitEvent: false });
    } else if (paidTotal > 0 && this.pendingAmount > 0) {
      this.saleForm.get('paymentStatus')?.setValue('Pending', { emitEvent: false });
    } else {
      this.saleForm.get('paymentStatus')?.setValue('Unpaid', { emitEvent: false });
    }
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
      mobileNumber: ['', [Validators.pattern(/^\d{10}$/)]],
      customerAddress: [''],
      extraDiscount: [0],
      total: [''],
      grandTotal: [''],
      paymentReceived: [false],
      type: ['Income'],
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
      saleDate: [new Date()],
      companyName: [''],
      category: [''],
      qty: [],
      productPrice: [0],
      discount: [0],
      subTotal: [0],
    });
    group.valueChanges.subscribe(() => {
      this.calculateSubTotal(group);
    });

     group.get('category')?.valueChanges.subscribe((selectedCategory: any) => {
    const stockCount = selectedCategory ? selectedCategory.stockCount : 0;
    group.get('qty')?.setValidators([
      Validators.required,
      Validators.min(1),
      this.stockQtyValidator(stockCount)
    ]);
    group.get('qty')?.updateValueAndValidity({ emitEvent: false });
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
      paymentR: [0, Validators.min(0)],
      paymentReceivedDate: [new Date()],
      paymentType: ['Cash'],
      bankName: ['']
    });
    group.get('paymentR')?.valueChanges.subscribe(() => {
      this.checkPaymentLimit();
    });
    return group;
  }

  getTotalPaymentReceived(): number {
    return this.paymentDetails.controls.reduce((sum, ctrl) => {
      return sum + (Number(ctrl.get('paymentR')?.value) || 0);
    }, 0);
  }

  checkPaymentLimit() {
    const totalPayment = this.getTotalPaymentReceived();
    const grandTotal = Number(this.saleForm.get('total')?.value) || 0;
    this.paymentExceeded = totalPayment > grandTotal;
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
      type: this.saleForm.value.type,
      paymentReceived: this.saleForm.value.paymentReceived,
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

  onCompanyChange(index: number) {
    const group = this.shellDetails.at(index) as FormGroup;
    const selectedCompany = group.get('companyName')?.value;

    if (selectedCompany) {
      group.get('category')?.enable();
      group.get('category')?.reset();

      this.filteredCategoryList[index] = this.categoryList.filter(
        (cat: any) => cat.companyName === selectedCompany.companyName
      );
        group.get('qty')?.setValue('');
        group.get('qty')?.setValidators([Validators.required, Validators.min(1)]);
        group.get('qty')?.updateValueAndValidity({ emitEvent: false });
    } else {
      group.get('category')?.reset();
      group.get('category')?.disable();
      this.filteredCategoryList[index] = [];
      group.get('qty')?.setValue('');
    }
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }

  getCategoryList() {
    this.loaderService.setLoader(true);

    this.firebaseService.getAllCategory().subscribe((res: any) => {
      if (res) {
        this.categoryList = res.filter((id: any) => id.userId === localStorage.getItem('userId'));
        this.companyList = this.categoryList.filter(
          (item: any, index: any, self: any) =>
            index === self.findIndex((t: any) => t.companyName === item.companyName)
        );

        if (this.action === 'Edit') {
          this.setCompanyAndCategoryEdit();
        }
      }
      this.loaderService.setLoader(false);
    });
  }

  setCompanyAndCategoryEdit() {
    this.local_data.shellDetails.forEach((detail: any, index: number) => {
      const formGroup = this.shellDetails.at(index) as FormGroup;

      const selectedCompany = this.companyList.find(
        (c: any) => c.id === detail.companyName || c.companyName === detail.companyName
      );

      if (selectedCompany) {
        formGroup?.get('companyName')?.setValue(selectedCompany);

        formGroup?.get('category')?.enable();

        this.filteredCategoryList[index] = this.categoryList.filter(
          (cat: any) => cat.companyName === selectedCompany.companyName
        );

        const selectedCategory = this.filteredCategoryList[index].find(
          (cat: any) => cat.id === detail.category || cat.categoryName === detail.category
        );

        if (selectedCategory) {
          formGroup?.get('category')?.setValue(selectedCategory);
        }
      }
    });
  }

  stockQtyValidator(stockCount: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const qty = Number(control.value) || 0;
  
      if (stockCount === 0 && qty > 0) {
        return { outOfStock: true };
      }
  
      if (qty > stockCount) {
        return { exceedsStock: true };
      }
  
      return null;
    };
  }

  getBalanceList() {
  this.loaderService.setLoader(true);

  this.firebaseService.getAllBalance().subscribe((res: any[]) => {
    if (res) {
      this.balanceList = res.find(
        item => item.userId === localStorage.getItem('userId')
      );
      if (this.action === 'Edit') {
        this.patchPaymentDetails();
      }
    }
    this.loaderService.setLoader(false);
  });
}


patchPaymentDetails() {
  this.local_data.paymentDetails?.forEach((detail: any, index: number) => {
    if (index > 0) this.addpaymentDetail();

    const formGroup = this.paymentDetails.at(index) as FormGroup;
    if (!formGroup) return;

    const paymentDate = detail.paymentReceivedDate
      ? new Date(detail.paymentReceivedDate.seconds * 1000)
      : null;

    let selectedBank = null;
    if (this.balanceList?.bankDetails?.length) {
      selectedBank = this.balanceList.bankDetails.find(
        (bank: any) => bank.id === detail.bankName
      );
    }
    formGroup.patchValue({
      paymentR: detail.paymentR,
      paymentReceivedDate: paymentDate,
      paymentType: detail.paymentType,
      bankName: selectedBank ,
    });
  });
}

}
