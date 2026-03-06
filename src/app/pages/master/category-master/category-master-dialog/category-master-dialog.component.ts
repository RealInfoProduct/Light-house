import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { map, Observable, startWith } from 'rxjs';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-category-master-dialog',
  templateUrl: './category-master-dialog.component.html',
  styleUrls: ['./category-master-dialog.component.scss']
})
export class CategoryMasterDialogComponent implements OnInit {
  categoryForm: FormGroup;
  action: string;
  local_data: any;

  options: string[] = [];
  filteredOptions: Observable<string[]>;

  companyoptions: string[] = [];
  filteredCompanyOptions: Observable<string[]>;

  categoryList: any[] = []


  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    public dialogRef: MatDialogRef<CategoryMasterDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.local_data = { ...data };
    this.action = this.local_data.action;
  }

  ngOnInit(): void {
    this.buildForm()
    if (this.action === 'Edit') {
      this.categoryForm.controls['category'].setValue(this.local_data.category)
      this.categoryForm.controls['companyName'].setValue(this.local_data.companyName)
      this.categoryForm.controls['mode'].setValue(this.local_data.mode)
      this.categoryForm.controls['keySpecifiCations'].setValue(this.local_data.keySpecifiCations)
      this.categoryForm.controls['warrantyPeriods'].setValue(this.local_data.warrantyPeriods)
      this.categoryForm.controls['stockCount'].setValue(this.local_data.stockCount)
    }
    this.getCategoryList()
    this.initializeAutocomplete();
  }


  buildForm() {
    this.categoryForm = this.fb.group({
      category: [''],
      companyName: [''],
      mode: [''],
      keySpecifiCations: [''],
      warrantyPeriods: [''],
      stockCount: [0],
    })
  }

  categoryPayload(): void {
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      category: this.categoryForm.value.category,
      companyName: this.categoryForm.value.companyName,
      mode: this.categoryForm.value.mode,
      keySpecifiCations: this.categoryForm.value.keySpecifiCations,
      warrantyPeriods: this.categoryForm.value.warrantyPeriods,
      stockCount: this.categoryForm.value.stockCount,
    }
    this.dialogRef.close({ event: this.action, data: payload });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }

  initializeAutocomplete() {

    this.filteredOptions = this.categoryForm.get('category')!.valueChanges.pipe(
      startWith(''),
      map(value => this.filterCategory(value || ''))
    );

    this.filteredCompanyOptions = this.categoryForm.get('companyName')!.valueChanges.pipe(
      startWith(''),
      map(value => this.filterCompany(value || ''))
    );

  }

  private filterCategory(value: string): string[] {
    const filterValue = (value || '').toLowerCase();
    return this.options.filter(option =>
      option.toLowerCase().includes(filterValue)
    );

  }

  private filterCompany(value: string): string[] {
    const filterValue = (value || '').toLowerCase();
    return this.companyoptions.filter(option =>
      option.toLowerCase().includes(filterValue)
    );

  }

  checkedValue() {
    const categoryValue = this.categoryForm.get('category')?.value?.trim();
    if (categoryValue && !this.options.includes(categoryValue)) {
      this.options.push(categoryValue);
    }

  }

  checkedValueCompany() {
    const companyValue = this.categoryForm.get('companyName')?.value?.trim();
    if (companyValue && !this.companyoptions.includes(companyValue)) {
      this.companyoptions.push(companyValue);
    }

  }

  getCategoryList() {
    this.loaderService.setLoader(true);
    this.firebaseService.getAllCategory().subscribe((res: any) => {
      if (res) {
        this.categoryList = res.filter(
          (item: any) => item.userId === localStorage.getItem("userId")
        );
        this.options = [
          ...new Set(this.categoryList.map((item: any) => item.category))
        ];
        this.companyoptions = [
          ...new Set(this.categoryList.map((item: any) => item.companyName))
        ];
        this.initializeAutocomplete();
        this.loaderService.setLoader(false);
      }

    });

  }


}