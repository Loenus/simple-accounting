module.exports = mongoose => {
  var schema = mongoose.Schema(
    {
      Data: Date,
      Operazione: String,
      Dettagli: String,
      ContoOrCarta: String,
      Contabilizzazione: String,
      Categoria: String,
      Valuta: String,
      Importo: Number
    },
    { timestamps: true }
  );

  schema.method("toJSON", function() {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Transaction = mongoose.model("Transaction", schema);
  return Transaction;
};