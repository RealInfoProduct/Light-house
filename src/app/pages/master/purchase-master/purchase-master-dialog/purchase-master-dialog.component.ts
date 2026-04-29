import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-purchase-master-dialog',
  templateUrl: './purchase-master-dialog.component.html',
  styleUrls: ['./purchase-master-dialog.component.scss']
})
export class PurchaseMasterDialogComponent implements OnInit {
  productForm: FormGroup;
  action: string;
  local_data: any;
  partyList: any = []
  categoryList: any = []
  companyList: any[] = [];
  filteredCategoryList: any[] = [];
  paymentExceeded = false;
  pendingAmount: number = 0;
  paymentDays = new Date()
  balanceList: any = []
  bank: any = [];

  StatusList: any[] = [
    { type: 'Pending' },
    { type: 'Paid' },
    { type: 'Unpaid' }
  ];

  paymenttype: any = [
    'Cash',
    'G-Pay'
  ]
  oldCompanyDetails: any[] = [];
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<PurchaseMasterDialogComponent>,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.local_data = { ...data };
    this.action = this.local_data.action;
  }

  ngOnInit(): void {
    this.buildForm();
    this.getPartyList();
    this.getCategoryList();
    this.calculatePending();
    this.paymentDaysChange();
    this.getBalanceList();
    if (this.action === 'Edit') {
      this.productForm.patchValue(this.local_data);
      this.local_data.companyDetails?.forEach((detail: any, index: number) => {
        if (index > 0) this.addproductDetail();
        const formGroup = this.companyDetails.at(index) as FormGroup;
        if (formGroup) {
          formGroup.patchValue({
            companyName: detail.companyName,
            category: detail.category,
            purchasePrice: detail.purchasePrice,
            itemCount: detail.itemCount,
            subTotal: detail.subTotal,
          });
        }
      });
      // this.local_data.paymentDetails?.forEach((detail: any, index: number) => {
      //   if (index > 0) this.addpaymentDetail();

      //   const formGroup = this.paymentDetails.at(index) as FormGroup;
      //   if (formGroup) {
      //     const paymentDate = detail.paymentReceivedDate
      //       ? new Date(detail.paymentReceivedDate.seconds * 1000)
      //       : null;
      //     formGroup.patchValue({
      //       paymentR: detail.paymentR,
      //       paymentReceivedDate: paymentDate,
      //       paymentType: detail.paymentType,
      //       bankName:  detail.bankName
      //     });
      //   }
      // });
    }
    this.productForm.valueChanges.subscribe(() => {
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


  onCompanyChange(index: number) {
    const group = this.companyDetails.at(index) as FormGroup;
    const selectedCompany = group.get('companyName')?.value;

    if (selectedCompany) {
      group.get('category')?.enable();
      group.get('category')?.reset();

      this.filteredCategoryList[index] = this.categoryList.filter(
        (cat: any) => cat.companyName === selectedCompany.companyName
      );
    } else {
      group.get('category')?.reset();
      group.get('category')?.disable();
      this.filteredCategoryList[index] = [];
    }
  }



  buildForm() {
    this.productForm = this.fb.group({
      billNo: [Validators.required],
      isParty: ['', Validators.required],
      paymentStatus: ['Unpaid', Validators.required],
      date: [new Date()],
      total: [0],
      paymentReceived: [false],
      type: ['Expense'],
      paymentDays: [0],
      otherKharch: [0],
      companyDetails: this.fb.array([this.createproductDetailGroup()]),
      paymentDetails: this.fb.array([this.createpaymentDetailGroup()])
    })
    this.paymentDaysChange()

  }

  limitDigits(event: any) {
    let value = event.target.value;
    value = value.replace(/\D/g, '');
    if (value.length > 3) {
      value = value.slice(0, 3);
    }
    event.target.value = value;
    this.productForm.get('paymentDays')?.setValue(value, { emitEvent: false });
  }

  paymentDaysChange() {
    this.productForm.get('paymentDays')?.valueChanges.subscribe((days: any) => {
      let numDays = parseInt(days, 10);
      if (isNaN(numDays) || numDays < 0) {
        numDays = 0;
      }

      const date = this.productForm.get('date')?.value;
      if (date) {
        const dueDate = new Date(date);
        dueDate.setDate(dueDate.getDate() + numDays);
        this.paymentDays = dueDate;
      }
    });
  }


  createproductDetailGroup(): FormGroup {
    const group = this.fb.group({
      companyName: [''],
      category: [{ value: '', disabled: true }],
      purchasePrice: [0, Validators.required],
      itemCount: [0, Validators.required],
      subTotal: [0]
    });


    group.valueChanges.subscribe(() => {
      this.calculateSubTotal(group);
    });

    return group;
  }

  createpaymentDetailGroup(): FormGroup {
    const group = this.fb.group({
      paymentR: [0, Validators.min(0)],
      paymentReceivedDate: [new Date()],
      paymentType: [''],
      bankName: ['']
    });

    this.checkPaymentError(group);
    group.get('paymentR')?.valueChanges.subscribe(() => {
      this.checkPaymentLimit();
    });
    group.valueChanges.subscribe(() => {
       this.checkCAshPaymentError(group);
    });
    return group;
  }


checkPaymentError(group: FormGroup) {
  const paymentType = group.get('paymentType')?.value;
  const amount = Number(group.get('paymentR')?.value) || 0;
  const bank = group.get('bankName')?.value;


  const control = group.get('paymentR');
  if (!control) return;

  let errors: any = {};

  if (paymentType === 'G-Pay' && bank) {
    if (amount > Number(bank.balance || 0)) {
      errors.insufficientBalance = true;
    }
  }

  const existingErrors = control.errors || {};

  control.setErrors(
    Object.keys(errors).length
      ? { ...existingErrors, ...errors }
      : null
  );
}

checkCAshPaymentError(group: FormGroup) {
  const paymentType = group.get('paymentType')?.value;
  const amount = Number(group.get('paymentR')?.value) || 0;

  const cashBalance = Number(this.balanceList?.cashBalance ?? 0);

  const control = group.get('paymentR');
  if (!control) return;

  let errors: any = {};

  if (paymentType === 'Cash') {
    if (amount > cashBalance) {
      errors.cashExceeded = true;
    }
  }

  const existingErrors = control.errors || {};

  control.setErrors(
    Object.keys(errors).length
      ? { ...existingErrors, ...errors }
      : null
  );

  control.markAsTouched();
}

onBankChange(control: AbstractControl) {
  const group = control as FormGroup;

  group.get('paymentR')?.markAsTouched();
  this.checkPaymentError(group);
}

  getTotalPaymentReceived(): number {
    return this.paymentDetails.controls.reduce((sum, ctrl) => {
      return sum + (Number(ctrl.get('paymentR')?.value) || 0);
    }, 0);
  }

  checkPaymentLimit() {
    const totalPayment = this.getTotalPaymentReceived();
    const grandTotal = Number(this.productForm.get('total')?.value) || 0;
    this.paymentExceeded = totalPayment > grandTotal;
  }

  calculateSubTotal(group: FormGroup) {
    const price = Number(group.get('purchasePrice')?.value) || 0;
    const count = Number(group.get('itemCount')?.value) || 0;

    const subTotal = price * count;

    group.get('subTotal')?.setValue(subTotal, { emitEvent: false });
    this.calculateGrandTotal();
  }

  calculateGrandTotal() {
    const total = this.companyDetails.controls.reduce((sum, ctrl) => {
      const subTotal = Number((ctrl as FormGroup).get('subTotal')?.value) || 0;
      return sum + subTotal;
    }, 0);
    const otherKharch = Number(this.productForm.get('otherKharch')?.value) || 0;
    const grandTotal = total + otherKharch;
    this.productForm.get('total')?.setValue(grandTotal, { emitEvent: false });
    this.calculatePending(grandTotal);
  }

  calculatePending(grandTotal?: number) {
    const totalAmount = (grandTotal ?? Number(this.productForm.get('total')?.value)) || 0;

    const paidTotal = this.paymentDetails.controls.reduce((sum, group) => {
      return sum + (Number(group.get('paymentR')?.value) || 0);
    }, 0);

    this.pendingAmount = totalAmount - paidTotal;

    if (this.pendingAmount === 0 && totalAmount > 0) {
      this.productForm.get('paymentStatus')?.setValue('Paid', { emitEvent: false });
    } else if (paidTotal > 0 && this.pendingAmount > 0) {
      this.productForm.get('paymentStatus')?.setValue('Pending', { emitEvent: false });
    } else {
      this.productForm.get('paymentStatus')?.setValue('Unpaid', { emitEvent: false });
    }
  }


  removeproductDetail(index: number) {
    this.companyDetails.removeAt(index);
    this.calculateGrandTotal();
  }

  addproductDetail() {
    this.companyDetails.push(this.createproductDetailGroup());
  }

  get companyDetails(): FormArray {
    return this.productForm.get('companyDetails') as FormArray;
  }

  removepaymentDetail(index: number) {
    this.paymentDetails.removeAt(index);
    this.checkPaymentLimit();
  }

  addpaymentDetail() {
    if (this.paymentExceeded) return;
    this.paymentDetails.push(this.createpaymentDetailGroup());
  }

  get paymentDetails(): FormArray {
    return this.productForm.get('paymentDetails') as FormArray;
  }


  purchasePayload(): void {
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      billNo: this.productForm.value.billNo,
      isParty: this.productForm.value.isParty,
      date: this.productForm.value.date,
      paymentStatus: this.productForm.value.paymentStatus,
      total: this.productForm.value.total,
      paymentReceived: this.productForm.value.paymentReceived,
      type: this.productForm.value.type,
      paymentDays: this.productForm.value.paymentDays,
      otherKharch: this.productForm.value.otherKharch,
      companyDetails: this.productForm.value.companyDetails,
      paymentDetails: this.productForm.value.paymentDetails
    };
    this.dialogRef.close({ event: this.action, data: payload });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }

  getCategoryList() {
    this.loaderService.setLoader(true);

    this.firebaseService.getAllCategory().subscribe((res: any) => {
      if (res) {
        this.categoryList = res.filter(
          (id: any) => id.userId === localStorage.getItem('userId')
        );

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

  getPartyList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllParty().subscribe((res: any) => {
      if (res) {
        this.partyList = res.filter((party: any) => party.userId === localStorage.getItem("userId"));

        if (this.action === 'Edit') {
          const selectedparty = this.partyList.find((party: any) => party.id === this.local_data.isParty);
          if (selectedparty) {
            this.productForm.controls['isParty'].setValue(selectedparty);
          }
        }
      }
      this.loaderService.setLoader(false);
    });
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
        bankName: selectedBank,
      });
    });
  }

  setCompanyAndCategoryEdit() {
    this.local_data.companyDetails.forEach((detail: any, index: number) => {
      const formGroup = this.companyDetails.at(index) as FormGroup;

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

  onOtherKharchInput(event: any) {
    let value = event.target.value;

    if (value.length > 1 && value.startsWith('0')) {
      event.target.value = value.replace(/^0+/, '');
      this.productForm.get('otherKharch')?.setValue(event.target.value);
    }
    this.calculateGrandTotal();
  }

}