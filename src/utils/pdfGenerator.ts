// Business Details (Edit as needed)
const BUSINESS_INFO = {
  name: "Godavari Specials",
  address: "H.No: 4-12, Hitech City, Road No 1, Hyderabad, TG",
  phone: "+91 94915 59901",
  email: "support@godavarispecials.com",
  gst: "36AAAAA0000A1Z5 (Sample)", // Placeholder
};

export const generateOrderPDF = async (order: any, type: 'INVOICE' | 'BILL' = 'INVOICE') => {
  let jsPDF;
  let autoTable;

  try {
    // Using UMD bundle for BOTH environments to bypass Turbopack's dynamic worker resolution issues in 'fflate'
    // @ts-ignore
    const jspdfModule = await import('jspdf/dist/jspdf.umd.min.js');
    jsPDF = jspdfModule.jsPDF || jspdfModule.default;
    
    // @ts-ignore
    const autotableModule = await import('jspdf-autotable');
    autoTable = autotableModule.default;
  } catch (err) {
    console.error("PDF module loading failed:", err);
    throw new Error("Failed to load PDF generation modules.");
  }

  const doc = new jsPDF() as any;
  const isBill = type === 'BILL';

  // 0. Logo Helper
  const getLogoBase64 = async (): Promise<string | null> => {
    try {
      if (typeof window === 'undefined') {
        const path = await import('path');
        const fs = await import('fs');
        const logoPath = path.join(process.cwd(), 'public/assets/logo.png');
        if (fs.existsSync(logoPath)) {
          return `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
        }
      } else {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(null);
          img.src = '/assets/logo.png';
        });
      }
    } catch (e) {
      console.error("Logo load failed:", e);
    }
    return null;
  };

  const logoBase64 = await getLogoBase64();

  // 1. Header & Logo
  const headerHeight = 45; // Reduced height
  doc.setFillColor(52, 114, 186); // Godavari Blue
  doc.rect(0, 0, 210, headerHeight, 'F');
  
  if (logoBase64) {
    const props = doc.getImageProperties(logoBase64);
    const targetWidth = 30; // Slightly smaller to fit better
    const targetHeight = (props.height * targetWidth) / props.width;
    const textFontSize = 14;
    const textHeight = 7; // Approx height in mm for size 14
    const totalGroupHeight = targetHeight + 4 + textHeight; // 4mm gap
    
    // Vertically center the entire group (Logo + Text)
    const yOffset = (headerHeight - totalGroupHeight) / 2;
    
    doc.addImage(logoBase64, 'PNG', 15, yOffset, targetWidth, targetHeight);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(textFontSize);
    doc.setFont('helvetica', 'bold');
    doc.text(isBill ? "FINAL BILL / RECEIPT" : "TAX INVOICE", 15, yOffset + targetHeight + 6);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(BUSINESS_INFO.name, 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(isBill ? "FINAL BILL / RECEIPT" : "TAX INVOICE", 15, 30);
  }

  // 2. Info Section (Order & Business) - Shifted down for new header height
  const infoStartY = headerHeight + 15;
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  
  // Right Align Order Info
  const rightX = 195;
  doc.text(`Order ID: ${order.orderId}`, rightX, infoStartY, { align: 'right' });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, rightX, infoStartY + 5, { align: 'right' });
  if (isBill && order.deliveredAt) {
    const dDate = typeof order.deliveredAt.toDate === 'function' ? order.deliveredAt.toDate() : new Date(order.deliveredAt);
    doc.text(`Delivered: ${dDate.toLocaleDateString('en-IN')}`, rightX, infoStartY + 10, { align: 'right' });
  }

  // Left Align Business & Customer Info
  doc.setFont('helvetica', 'bold');
  doc.text("From:", 15, infoStartY);
  doc.setFont('helvetica', 'normal');
  doc.text(BUSINESS_INFO.name, 15, infoStartY + 5);
  doc.text(BUSINESS_INFO.address, 15, infoStartY + 10, { maxWidth: 80 });
  doc.text(`Phone: ${BUSINESS_INFO.phone}`, 15, infoStartY + 20);
  doc.text(`GST: ${BUSINESS_INFO.gst}`, 15, infoStartY + 25);

  doc.setFont('helvetica', 'bold');
  doc.text("Bill To:", 100, infoStartY);
  doc.setFont('helvetica', 'normal');
  doc.text(order.address.name, 100, infoStartY + 5);
  doc.text(`${order.address.address1 || order.address.address}, ${order.address.address2 || ''}`, 100, infoStartY + 10, { maxWidth: 80 });
  doc.text(`${order.address.city} - ${order.address.pincode}`, 100, infoStartY + 20);
  doc.text(`Phone: ${order.address.phone || order.address.mobile}`, 100, infoStartY + 25);

  // 3. Items Table - Shifted down
  const tableStartY = infoStartY + 40;
  const tableData = order.items.map((item: any, index: number) => [
    index + 1,
    `${item.name} (${item.weight || ''})`,
    item.quantity,
    `INR ${item.price}`,
    `INR ${(Number(item.price) * item.quantity).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [52, 114, 186], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 15, right: 15 }
  });

  // 4. Summary & Payment
  let finalY = (doc as any).lastAutoTable.finalY + 10;

  // Draw a Payment Status Badge
  const statusX = 15;
  const statusText = isBill ? "PAID" : (order.paymentMethod === 'COD' ? "COD - PENDING" : "PAID");
  const badgeColor = isBill || order.paymentMethod !== 'COD' ? [34, 197, 94] : [249, 115, 22]; // Green vs Orange
  
  doc.setDrawColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(statusX, finalY, 40, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(statusText, statusX + 20, finalY + 5.5, { align: 'center' });

  // Totals on the right
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  const totalX = 140;
  const p = order.pricing || {};

  doc.text("Item Total:", totalX, finalY + 5);
  doc.text(`INR ${p.itemTotal || order.total || 0}`, rightX, finalY + 5, { align: 'right' });
  
  doc.text("GST (5%):", totalX, finalY + 11);
  doc.text(`INR ${p.gst || 0}`, rightX, finalY + 11, { align: 'right' });
  
  doc.text("Delivery Charges:", totalX, finalY + 17);
  doc.text(`INR ${p.deliveryCharge || 0}`, rightX, finalY + 17, { align: 'right' });

  doc.text("Packaging Charges:", totalX, finalY + 23);
  doc.text(`INR ${p.packagingCharge || 0}`, rightX, finalY + 23, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Grand Total:", totalX, finalY + 33);
  doc.text(`INR ${order.total || 0}`, rightX, finalY + 33, { align: 'right' });

  // 5. Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for shopping with us! This is a computer generated document.", 105, 280, { align: 'center' });

  // Return formatted output
  const output = doc.output();
  // On the server (Node), we might need a buffer. 
  // In Next.js API, we can use the Uint8Array/Buffer format.
  return {
    blob: doc.output('blob'),
    buffer: Buffer.from(doc.output('arraybuffer')),
    filename: `${isBill ? 'bill' : 'invoice'}_${order.orderId}.pdf`
  };
};
