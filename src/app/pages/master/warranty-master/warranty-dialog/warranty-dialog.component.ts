import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-warranty-dialog',
  templateUrl: './warranty-dialog.component.html',
  styleUrls: ['./warranty-dialog.component.scss']
})
export class WarrantyDialogComponent implements OnInit {
  warrantyForm: FormGroup;
  action: string;
  local_data: any;
  filteredCategoryList: any[] = [];
  categoryList: any[] = [];
  companyList: any[] = [];
  shellList: any[] = [];

  filteredWarrantyProducts: any = []
  warrantyTypeList: any[] = [
    'Pending',
    'in Progress',
    'Completed'
  ]

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<WarrantyDialogComponent>,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.local_data = { ...data };
    this.action = this.local_data.action;
  }

  ngOnInit(): void {
    this.buildForm();
    this.getCategoryList();
    this.getShellList();
    if (this.action === 'Edit') {
      this.warrantyForm.patchValue(this.local_data);
      this.warrantyForm.get('date')?.setValue(new Date(this.local_data.date.toDate()));
      this.local_data.shellDetails?.forEach((detail: any, index: number) => {
        if (index > 0) this.addShellDetail();
        const formGroup = this.shellDetails.at(index) as FormGroup;
        if (formGroup) {
          const SaleDate = detail.saleDate
            ? new Date(detail.saleDate.seconds * 1000)
            : null;
          const WarrantyDate = detail.warrantyDate
            ? new Date(detail.warrantyDate.seconds * 1000)
            : null;
          formGroup.patchValue({
            saleDate: SaleDate,
            warrantyDate: WarrantyDate,
            companyName: detail.companyName,
            category: detail.category,
            qty: detail.qty,
            warranty: detail.warranty,
            warrantyType: detail.warrantyType,
          });
        }
      });
    }
  }

  getShellList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllShell().subscribe((res: any) => {
      if (res) {
        this.shellList = res.filter((id: any) => id.userId === localStorage.getItem("userId"));
        this.filteredWarrantyProducts = [...this.shellList];
      }
      this.loaderService.setLoader(false)

    })
  }


  buildForm() {
    this.warrantyForm = this.fb.group({
      billNumber: [0],
      invoiceNo: [''],
      date: [new Date()],
      customerName: [''],
      mobileNumber: ['', [Validators.pattern(/^\d{10}$/)]],
      customerAddress: [''],
      shellDetails: this.fb.array([this.createSaleDetailGroup()]),
    })
  }

  createSaleDetailGroup(): FormGroup {
    const group = this.fb.group({
      saleDate: [new Date()],
      warrantyDate: [''],
      companyName: [''],
      category: [''],
      qty: [],
      warranty: [],
      warrantyType: ['']
    });
    group.get('saleDate')?.valueChanges.subscribe(() => this.updateWarrantyDate(group));
    group.get('warranty')?.valueChanges.subscribe(() => this.updateWarrantyDate(group));

    return group;
  }

  addShellDetail() {
    const group = this.createSaleDetailGroup();
    this.shellDetails.push(group);

  }

  removeShellDetail(index: number) {
    this.shellDetails.removeAt(index);
  }

  get shellDetails(): FormArray {
    return this.warrantyForm.get('shellDetails') as FormArray;
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

        // if (this.action === 'Edit') {
        //   this.setCompanyAndCategoryEdit();
        // }
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
          (cat: any) => cat.id === detail.category || cat.category === detail.category
        );

        if (selectedCategory) {
          formGroup?.get('category')?.setValue(selectedCategory);
        }
      }
      this.updateWarrantyDate(formGroup, detail.saleDate, detail.warranty);
    });
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


  convertToDate(date: any): Date {
    if (!date) return new Date();
    if (date.seconds) {
      return new Date(date.seconds * 1000);
    }
    return new Date(date);
  }


  onWarrantyProductChange(event: any) {
    const invoiceNo = event.value;

    const selectedInvoice = this.shellList.find(
      (item: any) => item.invoiceNo === invoiceNo
    );

    if (!selectedInvoice) return;

    this.warrantyForm.patchValue({
      billNumber: selectedInvoice.billNumber || 0,
      date: this.convertToDate(selectedInvoice.date),
      customerName: selectedInvoice.customerName || '',
      customerAddress: selectedInvoice.customerAddress || '',
      mobileNumber: selectedInvoice.mobileNumber || ''
    });

    this.shellDetails.clear();

    selectedInvoice.shellDetails?.forEach((item: any, index: number) => {
      const group = this.createSaleDetailGroup();

      const companyid = this.categoryList.find((cat: any) => cat.id === item.companyName).companyName;
      const categoryid = this.categoryList.find((cat: any) => cat.id === item.category).category;
      const keySpecifiCationsid = this.categoryList.find((cat: any) => cat.id === item.category).keySpecifiCations;

      group.patchValue({
        saleDate: this.convertToDate(item.saleDate),
        companyName: companyid,
        category: categoryid + ' ' + keySpecifiCationsid,
        qty: item.qty,
        warranty: item.warranty,
        warrantyDate: item.warrantyDate,
        warrantyType: item.warrantyType || ''
      });

      this.shellDetails.push(group);

      // if (item.companyName) {
      //   this.filteredCategoryList[index] = this.categoryList.find(
      //     (cat: any) => cat.id === item.companyName
      //   );
      // }

      // if (item.category) {
      //   this.filteredCategoryList[index] = this.categoryList.find(
      //     (cat: any) => cat.id === item.category
      //   );
      // }
      this.updateWarrantyDate(group, item.saleDate, item.warranty);
    });
  }

  filterWarrantyProducts(event: any) {
    const search = (event.target.value || '').toLowerCase();

    this.filteredWarrantyProducts = this.shellList.filter((item: any) =>
      item.invoiceNo?.toLowerCase().includes(search)
    );
  }

  updateWarrantyDate(group: FormGroup, saleDateValue?: any, warrantyValue?: any) {
    const saleDate = saleDateValue || group.get('saleDate')?.value;
    const warranty = warrantyValue ?? group.get('warranty')?.value;

    if (!saleDate || !warranty) {
      group.get('warrantyDate')?.setValue(null);
      return;
    }

    const sale = this.convertToDate(saleDate);
    const wholeYears = Math.floor(warranty);
    const fractional = warranty - wholeYears;
    const monthsToAdd = Math.round(fractional * 12);

    const warrantyDate = new Date(sale);
    warrantyDate.setFullYear(warrantyDate.getFullYear() + wholeYears);
    warrantyDate.setMonth(warrantyDate.getMonth() + monthsToAdd);

    group?.get('warrantyDate')?.setValue(warrantyDate);
  }

  warrantyPayload() {
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      invoiceNo: this.warrantyForm.value.invoiceNo,
      billNumber: this.warrantyForm.value.billNumber,
      date: this.warrantyForm.value.date,
      customerName: this.warrantyForm.value.customerName,
      mobileNumber: this.warrantyForm.value.mobileNumber,
      customerAddress: this.warrantyForm.value.customerAddress,
      shellDetails: this.warrantyForm.value.shellDetails
    }
    this.dialogRef.close({ event: this.action, data: payload })
    console.log(payload);

  }

  closeDialog() {
    this.dialogRef.close({ event: 'Cancel' });
  }
}
