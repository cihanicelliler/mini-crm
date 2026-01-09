# Mini-CRM UML Diyagramları

## 1. Use Case Diyagramı

```mermaid
flowchart TB
    subgraph Aktörler
        U((Kullanıcı))
        S((Sistem))
    end
    
    subgraph "Müşteri Yönetimi"
        UC1[Müşteri Listele]
        UC2[Müşteri Oluştur]
        UC3[Müşteri Güncelle]
        UC4[Müşteri Sil]
        UC5[Müşteri Detay Görüntüle]
    end
    
    subgraph "Sipariş Yönetimi"
        UC6[Sipariş Listele]
        UC7[Sipariş Oluştur]
        UC8[Sipariş Durumu Güncelle]
        UC9[Sipariş İptal Et]
        UC10[Guest Müşteri ile Sipariş]
    end
    
    subgraph "Ürün Yönetimi"
        UC11[Ürün Listele]
        UC12[Ürün Oluştur]
        UC13[Ürün Güncelle]
        UC14[Stok Ayarla]
        UC15[Ürün Sil]
    end
    
    U --> UC1 & UC2 & UC3 & UC4 & UC5
    U --> UC6 & UC7 & UC8 & UC9 & UC10
    U --> UC11 & UC12 & UC13 & UC14 & UC15
    
    UC7 --> S
    UC10 --> S
    S --> |Stok Kontrolü| UC14
```

---

## 2. Class Diyagramı

```mermaid
classDiagram
    class Customer {
        +int id
        +string firstName
        +string lastName
        +string email
        +string phone
        +string address
        +boolean isActive
        +datetime createdAt
        +datetime updatedAt
    }
    
    class Order {
        +int id
        +int customerId
        +string status
        +decimal totalAmount
        +datetime createdAt
        +datetime updatedAt
    }
    
    class OrderItem {
        +int id
        +int orderId
        +int productId
        +string productName
        +int quantity
        +decimal unitPrice
        +decimal totalPrice
    }
    
    class Product {
        +int id
        +string name
        +string sku
        +string description
        +decimal price
        +int stockQuantity
        +boolean trackStock
        +boolean isActive
        +increaseStock(qty)
        +decreaseStock(qty)
        +hasStock(qty)
    }
    
    Customer "1" --> "*" Order : has
    Order "1" --> "*" OrderItem : contains
    Product "1" --> "*" OrderItem : referenced by
```

---

## 3. Sequence Diyagramı - Sipariş Oluşturma

```mermaid
sequenceDiagram
    participant C as Client
    participant R as Router
    participant OS as OrderService
    participant CS as CustomerService
    participant PS as ProductService
    participant DB as Database
    
    C->>R: POST /api/orders
    R->>OS: createOrder(data)
    
    alt Guest Müşteri
        OS->>DB: Customer.create()
        DB-->>OS: customerId
    end
    
    loop Her ürün için
        OS->>PS: Product.findByPk(productId)
        PS-->>OS: product
        
        alt Stok yetersiz
            OS-->>R: Error: Insufficient stock
            R-->>C: 400 Bad Request
        end
        
        OS->>PS: decreaseStock(qty)
    end
    
    OS->>DB: Order.create()
    OS->>DB: OrderItem.bulkCreate()
    DB-->>OS: order
    OS-->>R: order with items
    R-->>C: 201 Created
```

---

## 4. Sequence Diyagramı - Müşteri CRUD

```mermaid
sequenceDiagram
    participant C as Client
    participant R as Router
    participant V as Validation
    participant S as CustomerService
    participant DB as Database
    
    Note over C,DB: GET /api/customers
    C->>R: GET /api/customers?page=1
    R->>S: listCustomers(options)
    S->>DB: findAndCountAll()
    DB-->>S: {rows, count}
    S-->>R: paginated result
    R-->>C: 200 OK
    
    Note over C,DB: POST /api/customers
    C->>R: POST /api/customers
    R->>V: requireFields, validateEmail
    V-->>R: valid
    R->>S: createCustomer(data)
    S->>DB: Customer.create()
    DB-->>S: customer
    S-->>R: customer
    R-->>C: 201 Created
    
    Note over C,DB: DELETE /api/customers/:id
    C->>R: DELETE /api/customers/1
    R->>S: deleteCustomer(id)
    S->>DB: Order.count(customerId)
    alt Siparişi var
        S->>DB: update(isActive: false)
        Note right of S: Soft Delete
    else Siparişi yok
        S->>DB: destroy()
        Note right of S: Hard Delete
    end
    S-->>R: success
    R-->>C: 204 No Content
```

---

## 5. Component Diyagramı

```mermaid
flowchart TB
    subgraph "Presentation Layer"
        API[REST API]
        SW[Swagger UI]
    end
    
    subgraph "Application Layer"
        MW[Middleware]
        RT[Routes]
        SV[Services]
    end
    
    subgraph "Data Layer"
        MD[Models]
        DB[(PostgreSQL)]
    end
    
    subgraph "Utilities"
        LG[Logger]
        PG[Pagination]
        VL[Validation]
    end
    
    API --> MW
    SW --> API
    MW --> RT
    RT --> VL
    RT --> SV
    SV --> MD
    MD --> DB
    SV --> LG
    RT --> PG
```

---

## 6. ER Diyagramı

```mermaid
erDiagram
    CUSTOMERS ||--o{ ORDERS : places
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : "included in"
    
    CUSTOMERS {
        int id PK
        varchar first_name
        varchar last_name
        varchar email
        varchar phone
        text address
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    ORDERS {
        int id PK
        int customer_id FK
        varchar status
        decimal total_amount
        timestamp created_at
        timestamp updated_at
    }
    
    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        varchar product_name
        int quantity
        decimal unit_price
        decimal total_price
    }
    
    PRODUCTS {
        int id PK
        varchar name
        varchar sku UK
        text description
        decimal price
        int stock_quantity
        boolean track_stock
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
```
