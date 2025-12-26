import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { CategoryMasterDialogComponent } from './category-master-dialog/category-master-dialog.component';
import { CategoryList } from 'src/app/interface/invoice';

@Component({
  selector: 'app-category-master',
  templateUrl: './category-master.component.html',
  styleUrls: ['./category-master.component.scss']
})
export class CategoryMasterComponent implements OnInit{ 
  displayedColumns: string[] = [
    'srno',
    'category',
    'companyName',
    'mode',
    'keySpecifiCations',
    'warrantyPeriods',
    'stockCount',
    'action',
  ];
  categoryList :any = []
  
  categoryDataSource = new MatTableDataSource(this.categoryList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(private dialog: MatDialog , 
    private firebaseService : FirebaseService , 
    private loaderService : LoaderService,
    private _snackBar: MatSnackBar,) { }


  ngOnInit(): void {
  this.getCategoryList()
  }

  applyFilter(filterValue: string): void {
    this.categoryDataSource.filter = filterValue.trim().toLowerCase();
  }
  
  addCategory(action: string, obj: any) {
    obj.action = action;
    const dialogRef = this.dialog.open(CategoryMasterDialogComponent, { data: obj });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Add') {
        const payload: CategoryList = {
          id: '',
          category: result.data.category,
          companyName: result.data.companyName,
          mode: result.data.mode,
          keySpecifiCations: result.data.keySpecifiCations,
          warrantyPeriods: result.data.warrantyPeriods,
          stockCount: result.data.stockCount,
          userId : localStorage.getItem("userId")
        }

        this.firebaseService.addCategory(payload).then((res) => {
          if (res) {
              this.getCategoryList()
              this.openConfigSnackBar('record create successfully')
            }
        } , (error) => {
         
        })
      }
      if (result?.event === 'Edit') {
        this.categoryList.forEach((element: any) => {
          if (element.id === result.data.id) {
            const payload: CategoryList = {
              id: result.data.id,
              category: result.data.category,
              companyName: result.data.companyName,
              mode: result.data.mode,
              keySpecifiCations: result.data.keySpecifiCations,
              warrantyPeriods: result.data.warrantyPeriods,
              stockCount: result.data.stockCount,
              userId : localStorage.getItem("userId")
            }
              this.firebaseService.updateCategory(result.data.id , payload).then((res:any) => {
                  this.getCategoryList()
                  this.openConfigSnackBar('record update successfully')
              }, (error) => {
                
              })
          }
        });
      }
      if (result?.event === 'Delete') {
        this.firebaseService.deleteCategory(result.data.id).then((res:any) => {
            this.getCategoryList()
            this.openConfigSnackBar('record delete successfully')
        }, (error) => {
      
        })
      }
    });
  }

  getCategoryList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllCategory().subscribe((res: any) => {
      if (res) {
        this.categoryList = res.filter((id:any) => id.userId === localStorage.getItem("userId"))
        this.categoryDataSource = new MatTableDataSource(this.categoryList);
        this.categoryDataSource.paginator = this.paginator;
        this.loaderService.setLoader(false)
      }
    })
  }

  openConfigSnackBar(snackbarTitle: any) {
    this._snackBar.open(snackbarTitle, 'Splash', {
      duration: 2 * 1000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
