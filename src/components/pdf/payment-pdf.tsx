'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBlock: {
    width: '45%',
  },
  infoLabel: {
    fontSize: 8,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 4,
  },
  colDate: { width: '20%' },
  colName: { width: '50%' },
  colAmount: { width: '30%', textAlign: 'right' },
  subtotalRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#999',
    paddingTop: 4,
    marginTop: 2,
  },
  subtotalLabel: {
    width: '70%',
    fontWeight: 'bold',
  },
  subtotalAmount: {
    width: '30%',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#333',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    width: '70%',
    fontWeight: 'bold',
    fontSize: 12,
  },
  totalAmount: {
    width: '30%',
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  },
})

interface PaymentItem {
  cleaning_date: string
  property_name: string
  amount: number
  expense_amount: number
  description?: string
}

interface PaymentPDFProps {
  year: number
  month: number
  staffName: string
  companyName: string
  items: PaymentItem[]
  cleaningTotal: number
  expenseTotal: number
  totalAmount: number
}

export default function PaymentPDF({
  year,
  month,
  staffName,
  companyName,
  items,
  cleaningTotal,
  expenseTotal,
  totalAmount,
}: PaymentPDFProps) {
  const formatAmount = (amount: number) =>
    `¥${amount.toLocaleString()}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>支払い明細書</Text>
          <Text style={styles.subtitle}>
            {year}年{month}月分
          </Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>支払い先</Text>
            <Text style={styles.infoValue}>{staffName} 様</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>発行元</Text>
            <Text style={styles.infoValue}>{companyName}</Text>
          </View>
        </View>

        {/* Cleaning items */}
        <Text style={styles.sectionTitle}>清掃報酬</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDate, { fontWeight: 'bold' }]}>日付</Text>
            <Text style={[styles.colName, { fontWeight: 'bold' }]}>物件名</Text>
            <Text style={[styles.colAmount, { fontWeight: 'bold' }]}>金額</Text>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDate}>{item.cleaning_date}</Text>
              <Text style={styles.colName}>{item.property_name}</Text>
              <Text style={styles.colAmount}>{formatAmount(item.amount)}</Text>
            </View>
          ))}

          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>小計（清掃報酬）</Text>
            <Text style={styles.subtotalAmount}>{formatAmount(cleaningTotal)}</Text>
          </View>
        </View>

        {/* Expenses */}
        {expenseTotal > 0 && (
          <>
            <Text style={styles.sectionTitle}>経費</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colDate, { fontWeight: 'bold' }]}>日付</Text>
                <Text style={[styles.colName, { fontWeight: 'bold' }]}>内容</Text>
                <Text style={[styles.colAmount, { fontWeight: 'bold' }]}>金額</Text>
              </View>

              {items
                .filter(item => item.expense_amount > 0)
                .map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.colDate}>{item.cleaning_date}</Text>
                    <Text style={styles.colName}>{item.description || '経費'}</Text>
                    <Text style={styles.colAmount}>{formatAmount(item.expense_amount)}</Text>
                  </View>
                ))}

              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>小計（経費）</Text>
                <Text style={styles.subtotalAmount}>{formatAmount(expenseTotal)}</Text>
              </View>
            </View>
          </>
        )}

        {/* Grand total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>合計金額</Text>
          <Text style={styles.totalAmount}>{formatAmount(totalAmount)}</Text>
        </View>

        <Text style={styles.footer}>
          CleanSync - 民泊清掃管理システム
        </Text>
      </Page>
    </Document>
  )
}
