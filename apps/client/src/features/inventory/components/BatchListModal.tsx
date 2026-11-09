import React, { useEffect, useState } from "react";
import { X, Calendar, AlertCircle, Layers, CheckCircle2 } from "lucide-react";

import type { IProductItem, IBatchItem } from "@pharmacy/shared";
import { pharmacyApi } from "../api/pharmacy.api";
import styles from "./BatchListModal.module.scss";

interface Props {
  product: IProductItem | null;
  onClose: () => void;
}

interface BatchApiResponse {
  data?: IBatchItem[] | BatchApiResponse;
}

interface BatchResult {
  batches: IBatchItem[];
}

const normalizeBatches = (response: unknown): IBatchItem[] => {
  if (Array.isArray(response)) {
    return response as IBatchItem[];
  }

  if (response && typeof response === "object" && "data" in response) {
    return normalizeBatches((response as BatchApiResponse).data);
  }

  return [];
};

export const BatchListModal: React.FC<Props> = ({ product, onClose }) => {
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const productId = product?.id;

  useEffect(() => {
    if (!productId) return;

    let isCancelled = false;

    const loadBatches = async () => {
      try {
        const response = await pharmacyApi.getBatchesByProduct(
          String(productId),
        );

        if (!isCancelled) {
          setBatchResult({
            batches: normalizeBatches(response),
          });
          setErrorMessage(null);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách lô:", error);

        if (!isCancelled) {
          setBatchResult({ batches: [] });
          setErrorMessage("Không thể tải danh sách lô. Vui lòng thử lại.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void loadBatches();

    return () => {
      isCancelled = true;
    };
  }, [productId]);

  if (!product) return null;

  const batches = batchResult?.batches ?? [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Chi tiết lô hàng trong kho (FEFO)</h3>

            <p className={styles.subtitle}>
              Thuốc: <strong>{product.name}</strong> ({product.sku})
              <span className={styles.separator}>|</span>
              Đơn vị cơ sở: <strong>{product.baseUnitName}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Đóng modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Đang tải danh sách lô...</div>
          ) : errorMessage ? (
            <div className={styles.error}>
              <AlertCircle size={32} />
              <p>{errorMessage}</p>
            </div>
          ) : batches.length === 0 ? (
            <div className={styles.empty}>
              <Layers size={36} />
              <p>Chưa có lô hàng nào được nhập cho loại thuốc này.</p>
            </div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Số lô</th>
                    <th>Tồn kho khả dụng</th>
                    <th>Hạn sử dụng</th>
                    <th>Ngày còn lại</th>
                    <th>Chiến lược FEFO</th>
                  </tr>
                </thead>

                <tbody>
                  {batches.map((batch) => (
                    <tr key={batch.id}>
                      <td className={styles.batchNumber}>
                        {batch.batchNumber}
                      </td>

                      <td>
                        <strong>
                          {batch.quantityRemaining.toLocaleString("vi-VN")}
                        </strong>{" "}
                        <span className={styles.unit}>
                          {product.baseUnitName}
                        </span>
                      </td>

                      <td>
                        <span className={styles.expiryDate}>
                          <Calendar size={13} />
                          {new Date(batch.expiryDate).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      </td>

                      <td>
                        {batch.daysUntilExpiry > 0 ? (
                          <span>{batch.daysUntilExpiry} ngày</span>
                        ) : (
                          <span className={styles.expired}>Đã hết hạn</span>
                        )}
                      </td>

                      <td className={styles.fefoCell}>
                        {batch.isFefoPriority ? (
                          <span className={styles.fefoPriority}>
                            <CheckCircle2 size={13} />
                            Xuất trước (FEFO)
                          </span>
                        ) : batch.status === "NEAR_EXPIRY" ? (
                          <span className={styles.nearExpiry}>
                            <AlertCircle size={13} />
                            Cận hạn
                          </span>
                        ) : (
                          <span className={styles.nextBatch}>Lô kế tiếp</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
