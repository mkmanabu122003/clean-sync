'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Note: In production, register a Japanese font for proper rendering
// Font.register({ family: 'NotoSansJP', src: '/fonts/NotoSansJP-Regular.ttf' })

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    // fontFamily: 'NotoSansJP',
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
  table: {
    marginBottom: 20,
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
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#333',
    paddingTop: 8,
    marginTop: 4,
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

interface InvoiceItem {
  cleaning_date: string
  property_name: string
  amount: number
  description?: string
}

interface InvoicePDFProps {
  invoiceNumber: string
  year: number
  month: number
  ownerName: string
  companyName: string
  issuedAt: string
  items: InvoiceItem[]
  totalAmount: number
}

export default function InvoicePDF({
  invoiceNumber,
  year,
  month,
  ownerName,
  companyName,
  issuedAt,
  items,
  totalAmount,
}: InvoicePDFProps) {
  const formatAmount = (amount: number) =>
    `¥${amount.toLocaleString()}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>請求書</Text>
          <Text style={styles.subtitle}>
            {year}年{month}月分
          </Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>請求先</Text>
            <Text style={styles.infoValue}>{ownerName} 様</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>発行元</Text>
            <Text style={styles.infoValue}>{companyName}</Text>
            <Text style={styles.infoLabel}>発行日</Text>
            <Text style={styles.infoValue}>{issuedAt}</Text>
            <Text style={styles.infoLabel}>請求書番号</Text>
            <Text style={styles.infoValue}>{invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDate, { fontWeight: 'bold' }]}>日付</Text>
            <Text style={[styles.colName, { fontWeight: 'bold' }]}>物件名</Text>
            <Text style={[styles.colAmount, { fontWeight: 'bold' }]}>金額</Text>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDate}>{item.cleaning_date}</Text>
              <Text style={styles.colName}>
                {item.property_name}
                {item.description ? `\n${item.description}` : ''}
              </Text>
              <Text style={styles.colAmount}>{formatAmount(item.amount)}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>合計金額</Text>
            <Text style={styles.totalAmount}>{formatAmount(totalAmount)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          CleanSync - 民泊清掃管理システム
        </Text>
      </Page>
    </Document>
  )
}
