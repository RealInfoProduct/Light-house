import { Component, OnInit, ViewChild } from '@angular/core';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexPlotOptions,
  ApexResponsive,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MaterialModule } from '../../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { CommonModule } from '@angular/common';

export interface yearlyChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  responsive: ApexResponsive;
}

@Component({
  selector: 'app-yearly-breakup',
  standalone: true,
  imports: [MaterialModule, NgApexchartsModule, TablerIconsModule, CommonModule],
  templateUrl: './yearly-breakup.component.html',
})
export class AppYearlyBreakupComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent
  public yearlyChart!: Partial<yearlyChart> | any;
  incomeExpenseList: any[] = []
  totalIncome: number = 0
  percentageChange: number = 0;
  selectedYear!: number;


  currentYear: number = new Date().getFullYear();
  previousYear: number = this.currentYear - 1;


  constructor(private firebaseService: FirebaseService, private loaderService: LoaderService) {

  }

  ngOnInit(): void {
    this.selectedYear = this.currentYear;

    this.yearlyChart = {
      series: [0, 0],
      chart: { type: 'donut', height: 130, toolbar: { show: false } },
      colors: ['#5D87FF', '#9db8f1'],
      plotOptions: { pie: { donut: { size: '75%' } } },
      dataLabels: { enabled: false },
      legend: { show: false },
      tooltip: { enabled: false },
    };

    this.getExpensesList(this.selectedYear)
  }


  getExpensesList(year: number) {
    this.loaderService.setLoader(true);

    this.firebaseService.getAllExpenses().subscribe({
      next: (res: any[]) => {
        const userId = localStorage.getItem('userId');

        const yearData = res.filter(item => {
          const itemYear = item.date?.seconds
            ? new Date(item.date.seconds * 1000).getFullYear()
            : new Date(item.date).getFullYear();
          return item.userId === userId && itemYear === year;
        });

        const incomeTotal = yearData
          .filter(item => item.accounttype === 'Income')
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        const expenseTotal = yearData
          .filter(item => item.accounttype === 'Expense')
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        this.totalIncome = incomeTotal - expenseTotal;

        const prevYearData = res.filter(item => {
          const itemYear = item.date?.seconds
            ? new Date(item.date.seconds * 1000).getFullYear()
            : new Date(item.date).getFullYear();
          return item.userId === userId && itemYear === year - 1;
        });

        const prevIncome = prevYearData
          .filter(item => item.accounttype === 'Income')
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        const prevExpense = prevYearData
          .filter(item => item.accounttype === 'Expense')
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        const prevTotal = prevIncome - prevExpense;

        this.percentageChange =
          prevTotal !== 0
            ? Math.max(-100, Math.min(100, ((this.totalIncome - prevTotal) / Math.abs(prevTotal)) * 100))
            : 0;

        if (this.chart && this.chart.chart) {
          this.chart.updateSeries([incomeTotal, expenseTotal], true);
        }

        this.loaderService.setLoader(false);
      },
      error: () => {
        this.totalIncome = 0;
        this.percentageChange = 0;
        if (this.chart && this.chart.chart) this.chart.updateSeries([0, 0], true);
        this.loaderService.setLoader(false);
      },
    });
  }



  onYearClick(year: number) {
    this.selectedYear = year;
    this.getExpensesList(year);
  }

}
