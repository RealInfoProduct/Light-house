import { Component, OnInit, ViewChild } from '@angular/core';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexPlotOptions,
  ApexFill,
  ApexMarkers,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MaterialModule } from '../../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule, NgForOf } from '@angular/common';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

interface month {
  value: number;
  viewValue: string;
}

export interface revenueChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  fill: ApexFill;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  grid: ApexGrid;
  marker: ApexMarkers;
}

@Component({
  selector: 'app-revenue-updates',
  standalone: true,
  imports: [NgApexchartsModule, MaterialModule, TablerIconsModule, NgForOf, CommonModule],
  templateUrl: './revenue-updates.component.html',
})
export class AppRevenueUpdatesComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;

  incomeExpenseList: any[] = [];
  public revenueChart!: Partial<revenueChart> | any;

  currentYear: number = new Date().getFullYear();
  totalIncome: number = 0;
  totalExpense: number = 0;
  totalEarnings = 0;

  monthlyIncome: number[] = new Array(12).fill(0);
  monthlyExpense: number[] = new Array(12).fill(0);


  currentMonthValue = new Date().getMonth(); 


  months: month[] = [
    { value: 0, viewValue: `January ${this.currentYear}` },
    { value: 1, viewValue: `February ${this.currentYear}` },
    { value: 2, viewValue: `March ${this.currentYear}` },
    { value: 3, viewValue: `April ${this.currentYear}` },
    { value: 4, viewValue: `May ${this.currentYear}` },
    { value: 5, viewValue: `June ${this.currentYear}` },
    { value: 6, viewValue: `July ${this.currentYear}` },
    { value: 7, viewValue: `August ${this.currentYear}` },
    { value: 8, viewValue: `September ${this.currentYear}` },
    { value: 9, viewValue: `October ${this.currentYear}` },
    { value: 10, viewValue: `November ${this.currentYear}` },
    { value: 11, viewValue: `December ${this.currentYear}` }
  ];

  constructor(private firebaseService: FirebaseService, private loaderService: LoaderService) {

    this.revenueChart = {
      series: [
        {
          name: 'Eanings this month',
          data: [],
          color: '#5D87FF',
        },
        {
          name: 'Expense this month',
          data: [],
          color: '#49BEFF',
        },
      ],
      chart: {
        type: 'bar',
        stacked: true,
        height: 380,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: { columnWidth: '20%', borderRadius: 6 },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      },
    };

    const now = new Date();
    const monthIndex = now.getMonth();
    this.currentMonthValue = this.months[monthIndex].value;
  }

  ngOnInit(): void {
    this.getExpensesList();
  }

  getExpensesList() {
    this.loaderService.setLoader(true);

    this.firebaseService.getAllExpenses().subscribe((res: any[]) => {
      if (res) {
        this.incomeExpenseList = res.filter(
          (item: any) => item.userId === localStorage.getItem('userId')
        );
        this.calculateMonthWiseTotals();
        this.loaderService.setLoader(false);
      }
    });
  }

  // calculateMonthWiseTotals() {
  //   this.monthlyIncome.fill(0);
  //   this.monthlyExpense.fill(0);

  //   this.totalIncome = 0;
  //   this.totalExpense = 0;

  //   this.incomeExpenseList.forEach(item => {
  //     const date: Date = item.date?.toDate
  //       ? item.date.toDate()
  //       : new Date(item.date);

  //     const month = date.getMonth();
  //     const year = date.getFullYear();
  //     const amount = Number(item.amount);

  //     if (year === this.currentYear) {
  //       if (item.accounttype === 'Income') {
  //         this.monthlyIncome[month] += amount;
  //         if (month === this.currentMonthValue) {
  //           this.totalIncome += amount;
  //         }
  //       } else if (item.accounttype === 'Expense') {
  //         this.monthlyExpense[month] += amount;
  //         if (month === this.currentMonthValue) {
  //           this.totalExpense += amount;
  //         }
  //       }
  //     }
  //   });

  //   // ✅ Final Earnings (MONTH WISE)
  //   this.totalEarnings = this.totalIncome - this.totalExpense;

  //   // update chart
  //   this.revenueChart.series = [
  //     { name: 'Income', data: [...this.monthlyIncome] },
  //     { name: 'Expense', data: [...this.monthlyExpense] },
  //   ];
  // }
  calculateMonthWiseTotals() {

  const systemYear = new Date().getFullYear();

  // ✅ Year change detect
  if (systemYear !== this.currentYear) {
    this.currentYear = systemYear;

    this.monthlyIncome = new Array(12).fill(0);
    this.monthlyExpense = new Array(12).fill(0);

    this.totalIncome = 0;
    this.totalExpense = 0;
    this.totalEarnings = 0;
  }

  this.monthlyIncome.fill(0);
  this.monthlyExpense.fill(0);

  this.totalIncome = 0;
  this.totalExpense = 0;

  this.incomeExpenseList.forEach(item => {
    const date: Date = item.date?.toDate
      ? item.date.toDate()
      : new Date(item.date);

    const month = date.getMonth();
    const year = date.getFullYear();
    const amount = Number(item.amount);

    if (year === this.currentYear) {
      if (item.accounttype === 'Income') {
        this.monthlyIncome[month] += amount;
        if (month === this.currentMonthValue) {
          this.totalIncome += amount;
        }
      } else if (item.accounttype === 'Expense') {
        this.monthlyExpense[month] += amount;
        if (month === this.currentMonthValue) {
          this.totalExpense += amount;
        }
      }
    }
  });

  this.totalEarnings = this.totalIncome - this.totalExpense;

  this.revenueChart.series = [
    { name: 'Income', data: [...this.monthlyIncome] },
    { name: 'Expense', data: [...this.monthlyExpense] },
  ];
}

  updateChart() {
    if (!this.chart) return;

    this.chart.updateSeries([
      {
        name: 'Eanings this month',
        data: this.monthlyIncome,
      },
      {
        name: 'Expense this month',
        data: this.monthlyExpense,
      },
    ], true);
  }


  onMonthChange(month: number) {
    this.currentMonthValue = month;
    this.calculateMonthWiseTotals();
  }


  formatIndianAmount(value: number): string {
    return value?.toLocaleString('en-IN') ?? '0';
  }

}
